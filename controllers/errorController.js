const AppError = require('../utils/appError');
module.exports = (err, res, req, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  res.status(err.statusCode).json({ status: err.status, message: err.message });
};
