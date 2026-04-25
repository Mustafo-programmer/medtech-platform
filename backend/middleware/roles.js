const allow = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Your role: ${req.user.role}. Required: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

module.exports = allow;