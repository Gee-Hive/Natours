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

exports.updateMe = async function (req, res, next) {
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

exports.getAllUsers = catchAsync(async function (req, res, next) {
  //To allow nested Get reviews on tours
  // let filter = {};
  // if (req.params.tourId) filter = { tour: req.params.tourId };

  // //executing query
  // const features = new APIFeatures(Model.find(filter), req.query)
  //   .filter()
  //   .sort()
  //   .limitFields()
  //   .paginate();
  // //const doc = await features.query.explain(); //To help explain the index function in postman
  const doc = await User.find();
  // sending response
  res.status(200).json({
    status: 'success',
    results: doc.length,
    data: {
      data: doc,
    },
  });
});

exports.getUser = catchAsync(async function (req, res, next) {
  let query = User.findById(req.params.id);

  //if (popOptions) query = query.populate(popOptions);

  const doc = await query;

  if (!doc) {
    return next(new AppError(`sorry cannot find current ID`, 404));
  }

  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    data: {
      data: doc,
    },
  });
});

exports.updateUser = catchAsync(async function (req, res, next) {
  const doc = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!doc) {
    return next(new AppError(`sorry cannot find matching ID`, 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      data: doc,
    },
  });
}); //do not update passwords with this

exports.deleteUser = catchAsync(async function (req, res, next) {
  const doc = await User.findByIdAndDelete(req.params.id);

  if (!doc) {
    return next(new AppError(`sorry cannot find matching ID`, 404));
  }
  res.status(204).json({
    status: 'success',
    data: {
      data: null,
    },
  });
});
