const API = 'http://localhost:5000/api';
let token = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');
let currentEquipmentId = null;

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  if (token && currentUser) {
    showApp();
  } else {
    showLogin();
  }

  // Login
  document.getElementById('login-btn').addEventListener('click', login);
  document.getElementById('password-input').addEventListener('keypress', e => {
    if (e.key === 'Enter') login();
  });

  // Logout
  document.getElementById('logout-btn').addEventListener('click', logout);

  // Nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const page = item.dataset.page;
      navigateTo(page);
    });
  });

  // Back button
  document.getElementById('back-btn').addEventListener('click', () => {
    showView('catalog-view');
    loadEquipment();
  });

  // Search & filter
  document.getElementById('search-input').addEventListener('input', debounce(loadEquipment, 400));
  document.getElementById('category-filter').addEventListener('change', loadEquipment);

  // Add equipment
  document.getElementById('add-equipment-btn').addEventListener('click', () => openEquipmentModal());

  // Add user
  document.getElementById('add-user-btn').addEventListener('click', () => openUserModal());

  // Modal close
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', closeModal);
});

// ── AUTH ──
async function login() {
  const login = document.getElementById('login-input').value.trim();
  const password = document.getElementById('password-input').value;
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';

  if (!login || !password) {
    errEl.textContent = 'Введите логин и пароль';
    return;
  }

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    token = data.token;
    currentUser = data.user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(currentUser));
    showApp();
  } catch (err) {
    errEl.textContent = err.message || 'Ошибка входа';
  }
}

function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  showLogin();
}

// ── PAGES ──
function showLogin() {
  document.getElementById('login-page').classList.remove('hidden');
  document.getElementById('app-page').classList.add('hidden');
}

function showApp() {
  document.getElementById('login-page').classList.add('hidden');
  document.getElementById('app-page').classList.remove('hidden');

  // Set user info
  document.getElementById('user-name').textContent = currentUser.name;
  const roleBadge = document.getElementById('user-role');
  roleBadge.textContent = currentUser.role;
  roleBadge.className = `role-badge ${currentUser.role}`;

  // Show/hide by role
  applyRoleVisibility();

  navigateTo('catalog');
}

function applyRoleVisibility() {
  const isAdmin  = currentUser.role === 'admin';
  const isEditor = currentUser.role === 'editor' || isAdmin;

  document.querySelectorAll('.admin-only').forEach(el => {
    el.classList.toggle('hidden', !isAdmin);
  });
  document.querySelectorAll('.editor-only').forEach(el => {
    el.classList.toggle('hidden', !isEditor);
  });
}

function navigateTo(page) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });

  if (page === 'catalog') {
    showView('catalog-view');
    loadEquipment();
  } else if (page === 'issues') {
    showView('issues-view');
    loadAllIssues();
  } else if (page === 'users') {
    showView('users-view');
    loadUsers();
  }
}

function showView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  document.getElementById(viewId).classList.remove('hidden');
}

// ── API HELPER ──
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

// ── EQUIPMENT ──
async function loadEquipment() {
  const search   = document.getElementById('search-input').value;
  const category = document.getElementById('category-filter').value;

  let query = '';
  if (search)   query += `search=${search}&`;
  if (category) query += `category=${category}&`;

  try {
    const equipment = await apiFetch(`/equipment?${query}`);
    renderEquipmentGrid(equipment);
  } catch (err) {
    console.error(err);
  }
}

function renderEquipmentGrid(equipment) {
  const grid = document.getElementById('equipment-grid');

  if (!equipment.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">🖥</div>
        <p>Оборудование не найдено</p>
      </div>`;
    return;
  }

  grid.innerHTML = equipment.map(eq => `
    <div class="equipment-card" onclick="openDetail('${eq._id}')">
      <div class="card-header">
        <span class="card-category">${eq.category}</span>
        <span class="card-status status-${eq.status}">${statusLabel(eq.status)}</span>
      </div>
      <div class="card-name">${eq.name}</div>
      <div class="card-manufacturer">${eq.manufacturer || '—'}</div>
      <div class="card-year">${eq.model || ''} ${eq.year ? '· ' + eq.year : ''}</div>
    </div>
  `).join('');
}

async function openDetail(id) {
  currentEquipmentId = id;
  showView('detail-view');

  try {
    const eq = await apiFetch(`/equipment/${id}`);
    renderDetail(eq);
    loadFiles(id);
    loadIssues(id);
    loadComments(id);
  } catch (err) {
    console.error(err);
  }
}

function renderDetail(eq) {
  document.getElementById('equipment-detail').innerHTML = `
    <div class="detail-header">
      <div class="detail-title">${eq.name}</div>
      <div class="detail-meta">
        <span><strong>Категория:</strong> ${eq.category}</span>
        <span><strong>Производитель:</strong> ${eq.manufacturer || '—'}</span>
        <span><strong>Модель:</strong> ${eq.model || '—'}</span>
        <span><strong>Год:</strong> ${eq.year || '—'}</span>
        <span><strong>Серийный №:</strong> ${eq.serialNumber || '—'}</span>
        <span><strong>Статус:</strong> ${statusLabel(eq.status)}</span>
      </div>
      <div class="detail-description">${eq.description || 'Описание отсутствует'}</div>
    </div>

    <div class="detail-tabs">
      <button class="tab-btn active" onclick="switchTab('files')">📎 Файлы</button>
      <button class="tab-btn" onclick="switchTab('issues')">⚠ Проблемы</button>
      <button class="tab-btn" onclick="switchTab('comments')">💬 Комментарии</button>
    </div>

    <div id="tab-files" class="tab-content active">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <span style="color:var(--text2);font-size:14px;">Документы и инструкции</span>
        <button class="btn btn-primary editor-only" onclick="openFileModal('${eq._id}')">+ Добавить файл</button>
      </div>
      <div id="files-list" class="files-list"></div>
    </div>

    <div id="tab-issues" class="tab-content">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <span style="color:var(--text2);font-size:14px;">Проблемы и решения</span>
        <button class="btn btn-primary editor-only" onclick="openIssueModal('${eq._id}')">+ Добавить</button>
      </div>
      <div id="equipment-issues-list"></div>
    </div>

    <div id="tab-comments" class="tab-content">
      <div id="comments-list" class="comments-list"></div>
      <div class="comment-form">
        <input type="text" id="comment-input" class="comment-input" placeholder="Написать комментарий...">
        <button class="btn btn-primary" onclick="addComment('${eq._id}')">Отправить</button>
      </div>
    </div>
  `;

  // re-apply role visibility for dynamically created elements
  applyRoleVisibility();

  // edit/delete buttons
  document.getElementById('edit-equipment-btn').onclick = () => openEquipmentModal(eq);
  document.getElementById('delete-equipment-btn').onclick = () => deleteEquipment(eq._id);
}

function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach((btn, i) => {
    const tabs = ['files', 'issues', 'comments'];
    btn.classList.toggle('active', tabs[i] === tab);
  });
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
}

// ── FILES ──
async function loadFiles(equipmentId) {
  try {
    const files = await apiFetch(`/files?equipment=${equipmentId}`);
    const list = document.getElementById('files-list');
    if (!files.length) {
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">📎</div><p>Файлы не добавлены</p></div>';
      return;
    }
    list.innerHTML = files.map(f => `
      <div class="file-item">
        <div class="file-info">
          <span class="file-name">${f.name}</span>
          <span class="file-type">${fileTypeLabel(f.type)}</span>
        </div>
        <div class="file-actions">
          <a href="${f.url}" target="_blank" class="btn btn-secondary">Открыть</a>
          <button class="btn btn-danger editor-only" onclick="deleteFile('${f._id}', '${equipmentId}')">Удалить</button>
        </div>
      </div>
    `).join('');
    applyRoleVisibility();
  } catch (err) { console.error(err); }
}

async function deleteFile(fileId, equipmentId) {
  if (!confirm('Удалить файл?')) return;
  try {
    await apiFetch(`/files/${fileId}`, { method: 'DELETE' });
    loadFiles(equipmentId);
  } catch (err) { alert(err.message); }
}

// ── ISSUES ──
async function loadIssues(equipmentId) {
  try {
    const issues = await apiFetch(`/issues?equipment=${equipmentId}`);
    const list = document.getElementById('equipment-issues-list');
    if (!issues.length) {
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">✅</div><p>Проблем не зафиксировано</p></div>';
      return;
    }
    list.innerHTML = issues.map(issue => renderIssueItem(issue)).join('');
    applyRoleVisibility();
  } catch (err) { console.error(err); }
}

async function loadAllIssues() {
  try {
    const issues = await apiFetch('/issues');
    const list = document.getElementById('issues-list');
    if (!issues.length) {
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">✅</div><p>Проблем не зафиксировано</p></div>';
      return;
    }
    list.innerHTML = issues.map(issue => renderIssueItem(issue)).join('');
  } catch (err) { console.error(err); }
}

function renderIssueItem(issue) {
  return `
    <div class="issue-item">
      <div class="issue-header">
        <span class="issue-problem severity-${issue.severity}">${issue.problem}</span>
        <span class="issue-status ${issue.status}">${issueStatusLabel(issue.status)}</span>
      </div>
      ${issue.cause    ? `<div class="issue-cause"><strong>Причина:</strong> ${issue.cause}</div>` : ''}
      ${issue.solution ? `<div class="issue-solution"><strong>Решение:</strong> ${issue.solution}</div>` : ''}
    </div>
  `;
}

// ── COMMENTS ──
async function loadComments(equipmentId) {
  try {
    const comments = await apiFetch(`/comments?equipment=${equipmentId}`);
    const list = document.getElementById('comments-list');
    if (!comments.length) {
      list.innerHTML = '<div style="color:var(--text2);font-size:14px;margin-bottom:16px;">Комментариев пока нет</div>';
      return;
    }
    list.innerHTML = comments.map(c => `
      <div class="comment-item">
        <div class="comment-header">
          <span class="comment-author">${c.author?.name || 'Пользователь'}</span>
          <span class="comment-date">${formatDate(c.createdAt)}</span>
        </div>
        <div class="comment-text">${c.text}</div>
      </div>
    `).join('');
  } catch (err) { console.error(err); }
}

async function addComment(equipmentId) {
  const input = document.getElementById('comment-input');
  const text = input.value.trim();
  if (!text) return;

  try {
    await apiFetch('/comments', {
      method: 'POST',
      body: JSON.stringify({ text, equipment: equipmentId })
    });
    input.value = '';
    loadComments(equipmentId);
  } catch (err) { alert(err.message); }
}

// ── USERS ──
async function loadUsers() {
  try {
    const users = await apiFetch('/auth/users');
    const list = document.getElementById('users-list');
    list.innerHTML = users.map(u => `
      <div class="user-item">
        <div class="user-item-info">
          <span class="user-item-name">${u.name}</span>
          <span class="user-item-login">@${u.login}</span>
        </div>
        <div class="user-item-actions">
          <select class="filter-select" onchange="updateUserRole('${u._id}', this.value)">
            <option value="viewer"  ${u.role==='viewer'  ? 'selected':''}>Viewer</option>
            <option value="editor"  ${u.role==='editor'  ? 'selected':''}>Editor</option>
            <option value="admin"   ${u.role==='admin'   ? 'selected':''}>Admin</option>
          </select>
          <button class="btn btn-danger" onclick="deleteUser('${u._id}')">Удалить</button>
        </div>
      </div>
    `).join('');
  } catch (err) { console.error(err); }
}

async function updateUserRole(userId, role) {
  try {
    await apiFetch(`/auth/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    });
  } catch (err) { alert(err.message); }
}

async function deleteUser(userId) {
  if (!confirm('Удалить пользователя?')) return;
  try {
    await apiFetch(`/auth/users/${userId}`, { method: 'DELETE' });
    loadUsers();
  } catch (err) { alert(err.message); }
}

// ── MODALS ──
function openEquipmentModal(eq = null) {
  document.getElementById('modal-title').textContent = eq ? 'Редактировать оборудование' : 'Добавить оборудование';
  document.getElementById('modal-body').innerHTML = `
    <div class="modal-form">
      <label>Название *</label>
      <input id="f-name" value="${eq?.name || ''}" placeholder="Название оборудования">
      <label>Категория</label>
      <select id="f-category">
        ${['ECG','EEG','Ultrasound','MRI','CT','Xray','Lab','Other'].map(c =>
          `<option value="${c}" ${eq?.category===c?'selected':''}>${c}</option>`
        ).join('')}
      </select>
      <label>Производитель</label>
      <input id="f-manufacturer" value="${eq?.manufacturer || ''}" placeholder="Производитель">
      <label>Модель</label>
      <input id="f-model" value="${eq?.model || ''}" placeholder="Модель">
      <label>Год</label>
      <input id="f-year" type="number" value="${eq?.year || ''}" placeholder="Год выпуска">
      <label>Серийный номер</label>
      <input id="f-serial" value="${eq?.serialNumber || ''}" placeholder="Серийный номер">
      <label>Статус</label>
      <select id="f-status">
        <option value="active"      ${eq?.status==='active'      ?'selected':''}>Активен</option>
        <option value="maintenance" ${eq?.status==='maintenance' ?'selected':''}>Обслуживание</option>
        <option value="retired"     ${eq?.status==='retired'     ?'selected':''}>Списан</option>
      </select>
      <label>Описание</label>
      <textarea id="f-description" placeholder="Описание">${eq?.description || ''}</textarea>
      <button class="btn btn-primary" onclick="saveEquipment('${eq?._id || ''}')">
        ${eq ? 'Сохранить' : 'Добавить'}
      </button>
    </div>
  `;
  openModal();
}

async function saveEquipment(id) {
  const data = {
    name:         document.getElementById('f-name').value.trim(),
    category:     document.getElementById('f-category').value,
    manufacturer: document.getElementById('f-manufacturer').value.trim(),
    model:        document.getElementById('f-model').value.trim(),
    year:         document.getElementById('f-year').value || undefined,
    serialNumber: document.getElementById('f-serial').value.trim(),
    status:       document.getElementById('f-status').value,
    description:  document.getElementById('f-description').value.trim(),
  };

  if (!data.name) { alert('Введите название'); return; }

  try {
    if (id) {
      await apiFetch(`/equipment/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      closeModal();
      openDetail(id);
    } else {
      await apiFetch('/equipment', { method: 'POST', body: JSON.stringify(data) });
      closeModal();
      loadEquipment();
    }
  } catch (err) { alert(err.message); }
}

async function deleteEquipment(id) {
  if (!confirm('Удалить оборудование? Это действие нельзя отменить.')) return;
  try {
    await apiFetch(`/equipment/${id}`, { method: 'DELETE' });
    showView('catalog-view');
    loadEquipment();
  } catch (err) { alert(err.message); }
}

function openFileModal(equipmentId) {
  document.getElementById('modal-title').textContent = 'Добавить файл';
  document.getElementById('modal-body').innerHTML = `
    <div class="modal-form">
      <label>Название файла *</label>
      <input id="f-fname" placeholder="Например: Инструкция по эксплуатации">
      <label>Тип</label>
      <select id="f-ftype">
        <option value="manual">Инструкция</option>
        <option value="service">Сервисное руководство</option>
        <option value="training">Обучение</option>
        <option value="certificate">Сертификат</option>
        <option value="other">Другое</option>
      </select>
      <label>Ссылка (Google Drive) *</label>
      <input id="f-furl" placeholder="https://drive.google.com/...">
      <button class="btn btn-primary" onclick="saveFile('${equipmentId}')">Добавить</button>
    </div>
  `;
  openModal();
}

async function saveFile(equipmentId) {
  const data = {
    name:      document.getElementById('f-fname').value.trim(),
    type:      document.getElementById('f-ftype').value,
    url:       document.getElementById('f-furl').value.trim(),
    equipment: equipmentId
  };
  if (!data.name || !data.url) { alert('Заполните все поля'); return; }
  try {
    await apiFetch('/files', { method: 'POST', body: JSON.stringify(data) });
    closeModal();
    loadFiles(equipmentId);
  } catch (err) { alert(err.message); }
}

function openIssueModal(equipmentId) {
  document.getElementById('modal-title').textContent = 'Добавить проблему';
  document.getElementById('modal-body').innerHTML = `
    <div class="modal-form">
      <label>Проблема *</label>
      <input id="f-iproblem" placeholder="Описание проблемы">
      <label>Причина</label>
      <input id="f-icause" placeholder="Возможная причина">
      <label>Решение</label>
      <textarea id="f-isolution" placeholder="Как решить"></textarea>
      <label>Критичность</label>
      <select id="f-iseverity">
        <option value="low">Низкая</option>
        <option value="medium" selected>Средняя</option>
        <option value="high">Высокая</option>
        <option value="critical">Критическая</option>
      </select>
      <button class="btn btn-primary" onclick="saveIssue('${equipmentId}')">Добавить</button>
    </div>
  `;
  openModal();
}

async function saveIssue(equipmentId) {
  const data = {
    problem:   document.getElementById('f-iproblem').value.trim(),
    cause:     document.getElementById('f-icause').value.trim(),
    solution:  document.getElementById('f-isolution').value.trim(),
    severity:  document.getElementById('f-iseverity').value,
    equipment: equipmentId
  };
  if (!data.problem) { alert('Опишите проблему'); return; }
  try {
    await apiFetch('/issues', { method: 'POST', body: JSON.stringify(data) });
    closeModal();
    loadIssues(equipmentId);
  } catch (err) { alert(err.message); }
}

function openUserModal() {
  document.getElementById('modal-title').textContent = 'Добавить пользователя';
  document.getElementById('modal-body').innerHTML = `
    <div class="modal-form">
      <label>Имя *</label>
      <input id="f-uname" placeholder="Имя пользователя">
      <label>Логин *</label>
      <input id="f-ulogin" placeholder="Логин">
      <label>Пароль *</label>
      <input id="f-upassword" type="password" placeholder="Пароль (мин. 6 символов)">
      <label>Роль</label>
      <select id="f-urole">
        <option value="viewer">Viewer — только просмотр</option>
        <option value="editor">Editor — просмотр и редактирование</option>
        <option value="admin">Admin — полный доступ</option>
      </select>
      <label>Язык</label>
      <select id="f-ulang">
        <option value="ru">Русский</option>
        <option value="uz">Узбекский</option>
        <option value="en">English</option>
      </select>
      <button class="btn btn-primary" onclick="saveUser()">Создать</button>
    </div>
  `;
  openModal();
}

async function saveUser() {
  const data = {
    name:     document.getElementById('f-uname').value.trim(),
    login:    document.getElementById('f-ulogin').value.trim(),
    password: document.getElementById('f-upassword').value,
    role:     document.getElementById('f-urole').value,
    language: document.getElementById('f-ulang').value,
  };
  if (!data.name || !data.login || !data.password) { alert('Заполните все поля'); return; }
  try {
    await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) });
    closeModal();
    loadUsers();
  } catch (err) { alert(err.message); }
}

// ── MODAL HELPERS ──
function openModal()  { document.getElementById('modal').classList.remove('hidden'); }
function closeModal() { document.getElementById('modal').classList.add('hidden'); }

// ── UTILS ──
function statusLabel(s) {
  return { active: 'Активен', maintenance: 'Обслуживание', retired: 'Списан' }[s] || s;
}
function issueStatusLabel(s) {
  return { open: 'Открыта', in_progress: 'В работе', resolved: 'Решена' }[s] || s;
}
function fileTypeLabel(t) {
  return { manual: 'Инструкция', service: 'Сервисное руководство', training: 'Обучение', certificate: 'Сертификат', other: 'Другое' }[t] || t;
}
function formatDate(d) {
  return new Date(d).toLocaleDateString('ru-RU', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
}
function debounce(fn, delay) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

// ── ADMIN ──
function switchAdminTab(tab) {
  document.querySelectorAll('#admin-view .tab-btn').forEach((btn, i) => {
    const tabs = ['dashboard', 'logs', 'settings'];
    btn.classList.toggle('active', tabs[i] === tab);
  });
  document.querySelectorAll('#admin-view .tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById(`admin-tab-${tab}`).classList.add('active');
}

async function loadAdminPage() {
  loadStats();
  loadLogs();
  loadSettings();
}

async function loadStats() {
  try {
    const s = await apiFetch('/admin/stats');

    document.getElementById('stats-grid').innerHTML = `
      <div class="stat-card">
        <div class="stat-value">${s.equipment}</div>
        <div class="stat-label">Оборудование</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${s.users}</div>
        <div class="stat-label">Пользователи</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:var(--danger)">${s.openIssues}</div>
        <div class="stat-label">Открытых проблем</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:var(--success)">${s.resolvedIssues}</div>
        <div class="stat-label">Решено проблем</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${s.files}</div>
        <div class="stat-label">Файлов</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${s.comments}</div>
        <div class="stat-label">Комментариев</div>
      </div>
    `;

    const maxCat = Math.max(...s.byCategory.map(c => c.count), 1);
    const maxSt  = Math.max(...s.byStatus.map(c => c.count), 1);

    document.getElementById('charts-row').innerHTML = `
      <div class="chart-card">
        <h4>По категориям</h4>
        ${s.byCategory.map(c => `
          <div class="chart-bar-row">
            <span class="chart-bar-label">${c._id}</span>
            <div class="chart-bar-track">
              <div class="chart-bar-fill" style="width:${(c.count/maxCat*100)}%"></div>
            </div>
            <span class="chart-bar-count">${c.count}</span>
          </div>
        `).join('')}
      </div>
      <div class="chart-card">
        <h4>По статусу</h4>
        ${s.byStatus.map(c => `
          <div class="chart-bar-row">
            <span class="chart-bar-label">${statusLabel(c._id)}</span>
            <div class="chart-bar-track">
              <div class="chart-bar-fill" style="width:${(c.count/maxSt*100)}%;background:${
                c._id==='active' ? 'var(--success)' :
                c._id==='maintenance' ? 'var(--warning)' : 'var(--danger)'
              }"></div>
            </div>
            <span class="chart-bar-count">${c.count}</span>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) { console.error(err); }
}

async function loadLogs() {
  try {
    const { logs } = await apiFetch('/admin/logs?limit=100');
    const list = document.getElementById('logs-list');
    if (!logs.length) {
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><p>Логи пусты</p></div>';
      return;
    }
    list.innerHTML = logs.map(l => `
      <div class="log-item">
        <span class="log-action log-${l.action}">${l.action}</span>
        <span class="log-detail">
          <span class="log-user">${l.user?.name || 'Система'}</span>
          ${l.entity ? `· ${l.entity}` : ''}
          ${l.detail ? `· <em>${l.detail}</em>` : ''}
        </span>
        <span class="log-date">${formatDate(l.createdAt)}</span>
      </div>
    `).join('');
  } catch (err) { console.error(err); }
}

async function clearLogs() {
  if (!confirm('Очистить все логи?')) return;
  try {
    await apiFetch('/admin/logs', { method: 'DELETE' });
    loadLogs();
  } catch (err) { alert(err.message); }
}

async function loadSettings() {
  try {
    const s = await apiFetch('/admin/settings');
    document.getElementById('settings-form').innerHTML = `
      <div class="settings-group">
        <h4>Общие</h4>
        <div class="settings-row">
          <label>Название сайта</label>
          <input id="s-name" value="${s.siteName}">
        </div>
        <div class="settings-row">
          <label>Язык по умолчанию</label>
          <select id="s-lang">
            <option value="ru" ${s.defaultLanguage==='ru'?'selected':''}>Русский</option>
            <option value="uz" ${s.defaultLanguage==='uz'?'selected':''}>Узбекский</option>
            <option value="en" ${s.defaultLanguage==='en'?'selected':''}>English</option>
          </select>
        </div>
        <div class="settings-row">
          <label>Макс. пользователей</label>
          <input id="s-maxusers" type="number" value="${s.maxUsersAllowed}">
        </div>
      </div>
      <div class="settings-group">
        <h4>Разрешения</h4>
        <div class="settings-row">
          <label>Разрешить комментарии</label>
          <label class="toggle">
            <input type="checkbox" id="s-comments" ${s.allowComments?'checked':''}>
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="settings-row">
          <label>Viewer может скачивать файлы</label>
          <label class="toggle">
            <input type="checkbox" id="s-download" ${s.allowViewerDownload?'checked':''}>
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
      <button class="btn btn-primary" onclick="saveSettings()">Сохранить настройки</button>
    `;
  } catch (err) { console.error(err); }
}

async function saveSettings() {
  const data = {
    siteName:            document.getElementById('s-name').value.trim(),
    defaultLanguage:     document.getElementById('s-lang').value,
    maxUsersAllowed:     Number(document.getElementById('s-maxusers').value),
    allowComments:       document.getElementById('s-comments').checked,
    allowViewerDownload: document.getElementById('s-download').checked,
  };
  try {
    await apiFetch('/admin/settings', { method: 'PUT', body: JSON.stringify(data) });
    alert('Настройки сохранены!');
  } catch (err) { alert(err.message); }
}

async function exportBackup() {
  try {
    const res = await fetch(`${API}/admin/export`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `medtech-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) { alert(err.message); }
}