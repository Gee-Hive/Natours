const AppError = require('./../utils/appError');

const HandleCastErrorDB = function (err) {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const HandleDuplicateFieldsDB = function (err) {
  const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/[0]);
  console.log(value);
  const message = `Duplicate field value: ${value}. Please use another value `;
  return new AppError(message, 400);
};

const HandleValidationErrorDB = function (err) {
  const errors = Object.values(err.errors).map(function (el) {
    el.message;
  });
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 404);
};
//jsonwebtoken error handling
const HandleJWTError = function () {
  throw new AppError('invalid token, please login again', 401);
};

const HandleJWTExpiredError = function () {
  return new AppError('Your token has expired, please login again', 401);
};

const sendErrorDev = function (err, res) {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = function (err, res) {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.error('ERROR', err);

    res.status(500).json({
      status: 'error',
      message: 'Sorry something went Wrong',
    });
  }
};

module.exports = function (err, req, res, next) {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    if (error.name === 'CastError') error = HandleCastErrorDB(error);
    if (error.code === 11000) error = HandleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = HandleValidationErrorDB(error);

    if (error.name === 'jsonWebTokenError') error = HandleJWTError();
    if (error.name === 'TokenExpiredError') error = HandleJWTExpiredError();

    sendErrorProd(error, res);
  }
};
