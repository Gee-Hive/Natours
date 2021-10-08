const express = require('express');
const ReviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true }); // to allow input of param from another route

router.use(authController.protect);

router
  .route('/')
  .post(
    authController.restrictTo('user'),
    ReviewController.setTourUserIds,
    ReviewController.createReview
  )
  .get(ReviewController.getAllReviews);

router
  .route('/:id')
  .get(ReviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    ReviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    ReviewController.deleteReview
  );

module.exports = router;
