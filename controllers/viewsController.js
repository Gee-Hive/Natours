const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res, next) => {
  //Get all tour data from collection
  const tours = await Tour.find();

  //build template(not in this folder)

  //render template using the tour data from set one
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'reviews, ratings, user',
  });
  res.status(200).render('tours', {
    title: 'The Forest Hiker Tour',
    data: {
      tour,
    },
  });
});
