const Equipment = require('../models/Equipment');
const EquipmentHistory = require('../models/EquipmentHistory');

const TRACKED_FIELDS = ['name', 'category', 'manufacturer', 'model', 'year', 'serialNumber', 'status', 'description', 'nextMaintenance'];

exports.getAll = async (req, res) => {
  try {
    const { category, status, search } = req.query;
    let filter = {};
    if (category) filter.category = category;
    if (status)   filter.status = status;
    if (search)   filter.name = { $regex: search, $options: 'i' };

    const equipment = await Equipment.find(filter)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(equipment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id)
      .populate('createdBy', 'name');
    if (!equipment) return res.status(404).json({ message: 'Equipment not found' });
    res.json(equipment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const equipment = await Equipment.create({ ...req.body, createdBy: req.user._id });

    await EquipmentHistory.create({
      equipment: equipment._id,
      changedBy: req.user._id,
      changes: [],
      type: 'CREATE'
    });

    res.status(201).json(equipment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const old = await Equipment.findById(req.params.id);
    if (!old) return res.status(404).json({ message: 'Equipment not found' });

    // Находим что изменилось
    const changes = [];
    for (const field of TRACKED_FIELDS) {
      const oldVal = old[field] != null ? String(old[field]) : '';
      const newVal = req.body[field] != null ? String(req.body[field]) : '';
      if (oldVal !== newVal) {
        changes.push({ field, oldValue: oldVal || '—', newValue: newVal || '—' });
      }
    }

    const equipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // Сохраняем историю если были изменения
    if (changes.length > 0) {
      await EquipmentHistory.create({
        equipment: req.params.id,
        changedBy: req.user._id,
        changes,
        type: 'UPDATE'
      });
    }

    res.json(equipment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
      const equipment = await Equipment.findByIdAndDelete(req.params.id);
      if (!equipment) return res.status(404).json({ message: 'Equipment not found' });

      await EquipmentHistory.create({
        equipment: req.params.id,
        changedBy: req.user._id,
        changes: [],
        type: 'DELETE'
      });

      res.json({ message: 'Equipment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const history = await EquipmentHistory.find({ equipment: req.params.id })
      .populate('changedBy', 'name role')
      .sort({ createdAt: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};