const Review = require('./../models/reviewModel');

const catchAsync = require('./../utils/catchAsync');

const factory = require('./handlerFactory');

exports.setTourUserIds = function (req, res, next) {
  //Allow nested routes. to create new reviews through the tour routes instead of the review routes itself
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getAllReviews = factory.getAll(Review);

exports.getReview = factory.getOne(Review);

exports.createReview = factory.createOne(Review);

exports.updateReview = factory.updateOne(Review);

exports.deleteReview = factory.deleteOne(Review);
