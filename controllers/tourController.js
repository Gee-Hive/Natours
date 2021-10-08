const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

exports.topfiveTours = function (req, res, next) {
  req.query.limit = '3';
  req.query.sort = '-ratingsAverage,price';
  //req.query.fields = 'name,price,ratingsAverage,difficulty,summary';// dont know why fields function not working
  next();
};

exports.getAllTours = catchAsync(async function (req, res, next) {
  //To allow nested Get reviews on tours
  let filter = {};
  if (req.params.tourId) filter = { tour: req.params.tourId };

  //executing query
  const features = new APIFeatures(Tour.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  //const doc = await features.query.explain(); //To help explain the index function in postman
  const doc = await features.query.explain();
  // sending response
  res.status(200).json({
    status: 'success',
    results: doc.length,
    data: {
      data: doc,
    },
  });
});

exports.getTour = catchAsync(async function (req, res, next) {
  let query = Tour.findById(req.params.id).populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });

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

exports.createTour = catchAsync(async function (req, res, next) {
  const doc = await Tour.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      data: doc,
    },
  });
});
//update
exports.updateTour = catchAsync(async function (req, res, next) {
  const doc = await Tour.findByIdAndUpdate(req.params.id, req.body, {
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
//delete
exports.deleteTour = catchAsync(async function (req, res, next) {
  const doc = await Tour.findByIdAndDelete(req.params.id);

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

exports.getTourStats = catchAsync(async function (req, res, next) {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: '$difficulty',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $match: { _id: { $ne: 'easy' } },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async function (req, res, next) {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStats: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTourStat: -1 },
    },
    // {
    //   $limit: 12,
    // },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});

exports.getToursWithin = catchAsync(async function (req, res, next) {
  const { distance, latlng, unit } = req.params;

  const { lat, lng } = latlng.split(','); // to seperate the query(latitude and longitude)

  //                          calculated for metre  :  calculated for kilometre
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1; //this to be converted to radiance(divide our distance by radius of earth)

  if (!lat || !lng) {
    return next(
      new AppError(
        'please provide latitude and longitude in this format latlng',
        400
      )
    );
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }, //radius is the distance of earth.
  }); //this geowithin function is to find a data(tour) within a certain geometric

  res.status(200).json({
    status: 'successful',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});
