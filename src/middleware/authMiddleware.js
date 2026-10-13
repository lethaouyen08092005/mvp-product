var jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  var authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Vui long dang nhap",
    });
  }

  var parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
    return res.status(401).json({
      success: false,
      message: "Dinh dang Token khong hop le",
    });
  }

  var token = parts[1];

  try {
    var decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token khong hop le hoac da het han",
    });
  }
}

module.exports = authMiddleware;
