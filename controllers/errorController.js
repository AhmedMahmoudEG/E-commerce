const AppError = require("../utils/appError");
const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};
const handleDublicateFieldDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `Duplicate Field value : ${value},Please use another value`;
  return new AppError(message, 400);
};
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid Input Data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};
const handleJWTError = () =>
  new AppError("invalid Token, Please login again!", 401);

const handleJWTExpired = () =>
  new AppError("Your token has been Expired, Please Login again!", 401);
const sendErrorDev = (err, req, res) => {
  //send error to api
  if (req.originalUrl.startsWith("/api")) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  }
};
const sendErrorProd = (err, req, res) => {
  //predicted errors
  if (req.originalUrl.startsWith("/api")) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        statusbar: err.status,
        message: err.message,
      });
    }
    //B) //programming or other unknown errors
    //send generic message
    console.log("Error ", err);
    return res.status(500).json({
      status: "ERROR 💥",
      message: "Something went wrong!",
    });
  }
};
module.exports = (err, res, req, next) => {
  if (process.env.NODE_ENV == "development") {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV == "production") {
    let error = err;
    if (error.name == "CastError") error = handleCastError(error);
    if (error.code == 11000) error = handleDublicateFieldDB(error);
    if (error.name == "ValidationError") error = handleValidationErrorDB(error);
    if (error.name == "JsonWebTokenError") error = handleJWTError();
    if (error.name == "TokenExipredError") error = handleJWTExpired();
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";
    sendErrorProd(err, req, res);
  }
};
