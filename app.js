const path = require('path'); //is a built in core module used to manipulate path names or folder
const express = require('express');
const { Router } = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
// const errorController = require('./controllers/errorController');
const app = express();

//Pug engine setup(frontend)
app.set('view engine', 'pug'); //this function is for building the front page of the application
app.set('views', path.join(__dirname, 'views')); //for directory of folder files

// All Middlewares
//To set Security  HTTP Header or setting
app.use(helmet());

//develpment logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
//To limit number of request from a particular IP.
const limiter = rateLimit({
  max: 100,
  windowMS: 60 * 60 * 1000,
  message:
    'Sorry too many request from this IP. Please try agin in next one hour',
});

app.use('/api', limiter);

//Body parser, reading data from the body into req.body
app.use(express.json({ limit: '10kb' })); // to limit amount of data sent from an ip.OPTIONAL

//Data Sanitazation against NoSQL query injection
app.use(mongoSanitize());

//Data Sanitization against NoSQL XSS(Cross Site Scripting Attacks)
app.use(xss());

//prevent paramter pollution, clean up query string
app.use(hpp());

//serving static files
app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
  req.requestTime = new Date().toISOString();
  next();
});

//routes

app.get('/', (req, res, next) => {
  res.status(200).render('base', {
    tour: 'The Forest Hiker',
    user: 'jonas',
  });
}); //for testing the pug functions created

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', function (req, res, next) {
  // const err = new Error(`cannot find ${req.originalUrl} on this server`);
  // err.status = 'fail';
  // err.statusCode = 404;

  next(new AppError(`cannot find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
