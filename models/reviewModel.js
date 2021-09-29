const mongoose = require('mongoose');

const Tour = require('./tourModel');
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'A review content is required'],
      trim: true,
    },

    rating: {
      type: Number,
      default: 4.5,
      min: [1, 'minimum rating is 1.0'],
      max: [5, 'maximum rating is 5.0'],
    },

    createdAt: Date,

    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A review must have a tour belonging to it'],
    },

    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true }); // to prevent duplicate review by same id and for same tour

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name',
  // }).populate({
  //   path: 'user',
  //   select: 'name photo',
  // });

  this.populate({
    path: 'user', // which path you wish to populate(show details) in the query field
    select: 'name photo', // which object field you wish to ignore when displaying details(populating)
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }, //to get all the review that corresponds or maatch the current tour id
    },
    {
      $group: {
        //all what the document have in common to group them by
        _id: 'tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: stats(0).nRating,
    ratingAverage: stats(0).avgRating,
  });
};

reviewSchema.post('save', function (/*post does not have a next function*/) {
  //this points to the current review that is being saved for a particular tour

  this.constructor.calcAverageRatings(this.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
