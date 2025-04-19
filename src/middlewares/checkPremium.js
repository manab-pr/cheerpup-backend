function checkPremium(req, res, next) {
    if (req.user && req.user.isPremium) {
      return next();
    } else {
      return res.status(403).json({ message: 'You need to upgrade to the premium version.' });
    }
  }
  
  module.exports = checkPremium;
  