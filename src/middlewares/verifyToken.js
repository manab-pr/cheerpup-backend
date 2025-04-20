const jwt = require("jsonwebtoken");

// verify token middleware

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.token;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json("Token is not valid");
      req.user = user;
      return next();
    });
  } else {
    return res.status(401).json("you're not authenticated");
  }
};


// verify token and authorization middleware

const verifyTokenandAuthorization = (req, res, next) => {
  verifyToken(req, res, () => {
    console.log("User ID from token:", req.user.id);
    console.log("User ID from params:", req.params.id);
    if (req.user.id === req.params.id || req.user.isAdmin) {
      next();
    } else {
      res.status(403).json("You're not allowed to do that");
    }
  });
};



module.exports = {
  verifyToken,
  verifyTokenandAuthorization
};
