const catchAsync = require('./../utils/catchAsync');
const User = require('./../models/userModel');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

const filterObj = function (obj, ...allowedFields) {
  const newObj = {};

  Object.keys(obj).forEach(function (el) {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.updateMe = function (req, res, next) {
  //check if the user tries to update passwords instead of data
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('invalid route for update password', 400));
  }

  // filter unwanted fields we dont want in the body first
  const filterBody = filterObj(req.body, 'name', 'email');
  //update the user data instead
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filterBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
};

exports.getMe = function (req, res, next) {
  req.params.id = req.user.id;
  next();
};

exports.deleteMe = catchAsync(async function (req, res, next) {
  // just to deactivate the user account
  await User.findByIdAndDelete(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = function (req, res) {
  res.status(500).json({
    status: 'error',
    message:
      'This user handler is not available. please sign up using the signup routes',
  });
};

exports.getAllUsers = factory.getAll(User);

exports.getUser = factory.getOne(User);

exports.updateUser = factory.updateOne(User); //do not update passwords with this

exports.deleteUser = factory.deleteOne(User);
