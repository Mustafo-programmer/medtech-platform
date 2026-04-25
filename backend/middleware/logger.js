const Log = require('../models/Log');

const log = (action, entity) => async (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = function(data) {
    if (res.statusCode < 400) {
      Log.create({
        user:     req.user?._id,
        action,
        entity,
        entityId: req.params?.id || data?._id,
        detail:   req.body?.name || req.body?.problem || req.body?.login || '',
        ip:       req.ip
      }).catch(console.error);
    }
    return originalJson(data);
  };

  next();
};

module.exports = log;