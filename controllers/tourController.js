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

exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, { path: 'reviews' });

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

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
