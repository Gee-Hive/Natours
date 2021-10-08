const Review = require('./../models/reviewModel');

const catchAsync = require('./../utils/catchAsync');

const factory = require('./handlerFactory');

exports.setTourUserIds = function (req, res, next) {
  //Allow nested routes. to create new reviews through the tour routes instead of the review routes itself
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getAllReviews = catchAsync(async function (req, res, next) {
  //To allow nested Get reviews on tours
  // let filter = {};
  // if (req.params.tourId) filter = { tour: req.params.tourId };

  // //executing query
  // const features = new APIFeatures(Model.find(filter), req.query)
  //   .filter()
  //   .sort()
  //   .limitFields()
  //   .paginate();
  //const doc = await features.query.explain(); //To help explain the index function in postman
  const doc = await Review.find();
  // sending response
  res.status(200).json({
    status: 'success',
    results: doc.length,
    data: {
      data: doc,
    },
  });
});

exports.getReview = catchAsync(async function (req, res, next) {
  let query = Review.findById(req.params.id);

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

exports.createReview = catchAsync(async function (req, res, next) {
  const doc = await Review.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      data: doc,
    },
  });
});

exports.updateReview = catchAsync(async function (req, res, next) {
  const doc = await Review.findByIdAndUpdate(req.params.id, req.body, {
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
});

exports.deleteReview = catchAsync(async function (req, res, next) {
  const doc = await Review.findByIdAndDelete(req.params.id);

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
