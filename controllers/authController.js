const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const User = require('./../models/userModel');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

const signToken = function (id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createAndSendToken = function (user, statusCode, res) {
  const token = signToken({ id: user._id });
  //to send token via cookie to the server or client
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_EXPIRES_COOKIE_IN * 24 * 60 * 60 * 1000
    ),
    secure: true,
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'development') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;
  //cookie code stops here

  //send token
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

//for signup
exports.signup = catchAsync(async function (req, res, next) {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  //send token with above made function
  createAndSendToken(newUser, 201, res);
});

//for login
exports.login = catchAsync(async function (req, res, next) {
  const { email, password } = req.body;

  // i) check if email and password exists

  if (!email || !password) {
    return next(new AppError('please pass in the right params'), 401);
  }

  //ii) check if user exists && password is correct

  const user = await User.findOne({ email }).select('+password');

  //iii) check if everything is fine , then send token to user
  //implement function in model file

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('invalid password or email', 401));
  }
  createAndSendToken(user, 200, res);
});

exports.protect = catchAsync(async function (req, res, next) {
  //to check if there is a token assigned to the user using the header function.(token assigned to bearer)
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('user not logged in. please login to gain access', 401)
    );
  }

  //verification check(if one manipulated the token or maybe it expired)
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //check if user still exists
  const freshUser = User.findById(decoded.id);

  if (!freshUser) {
    return next(
      new AppError('sorry this token doesnt belong to this user', 401)
    );
  }
  /*
      This line of code below seems not to be function despite following the steps

  check if user has changed password after a token was issued
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('user changed password. please input new password', 401)
    );
  }
*/

  // Grant user access to routes
  req.user = freshUser;

  next();
});
//this function usage is for things like deleting the tours which should be restricted to admins only
exports.restrictTo = function (...roles) {
  return function (req, res, next) {
    if (!roles.includes(req.user.role)) {
      throw new AppError('sorry you do not have access', 403);
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async function () {
  //first get user email which was inputed
  const { email } = req.body.email;

  const user = await User.findOne({ email });

  if (!user) throw new AppError('Invalid user ID', 404);

  //2) generate random token for users
  const resetToken = user.createPaswordResetToken();
  await user.save({ validateBeforeSave: false });

  //send the token to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `forgot your password? Submit a PATCH request with your new password
   and passwordConfirm to :${resetURL}\nIf you didnt forget your password please ignore this email`;

  // import and use function from utils @emails.js
  try {
    await sendEmail({
      email: user.email,
      subject: `Your password reset token(valid for 10 min)`,
      message,
    });

    //send message about where
    res.status(200).json({
      status: 'success',
      message: ' token sent to email',
    });
  } catch (err) {
    //reset both token and expires property before sending error
    (user.passwordResetToken = undefined),
      (user.passwordResetExpires = undefined);
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending email. try again', 500)
    );
  }
});

exports.resetPassword = catchAsync(async function () {
  //get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  //checking also if user has not expired
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //set new password only if token hasnt expired and there is user
  if (!user) throw new AppError('Token is invalid or has expired', 400);

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  (user.passwordResetToken = undefined),
    (user.passwordResetExpires = undefined);
  await user.save();
  //update changedPassword property of the user

  //log user in and send JWT(token)
  createAndSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async function (req, res, next) {
  //get user from the collection first
  const { email, password } = req.body;

  const user = User.findbyId({ id: req.user.id }).select('+password');

  //check if the posted password is correct
  if (!(await user.correctPassword(password, user.password))) {
    throw new AppError('invalid password', 401);
  }

  //update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  //log user in with the updated password
  createAndSendToken(user, 200, res);
});
