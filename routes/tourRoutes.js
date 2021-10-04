const express = require('express');
const router = express.Router();
const tourController = require('./../controllers/tourController');

const authController = require('./../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes');

// router.param('id', tourController.checkID);

// for nested routes
// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview
//   );

router.use('/:tourId/reviews', reviewRouter); //nested route advanced

router
  .route('/top-5-tours')
  .get(tourController.topfiveTours, tourController.getAllTours);
//
router.route('/tour-stats').get(tourController.getTourStats);

router
  .route('/tour-monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);
//this is also transformed like this (tours-within/233/center/-45,46/unit/mi)

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
