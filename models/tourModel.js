const mongoose = require('mongoose');

const slugify = require('slugify');

// const User = require('./userModel');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal than 40 characters'],
      minlength: [10, 'A tour name must have more or equal than 10 characters'],
    },

    slug: String,

    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },

    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },

    difficulty: {
      type: String,
      required: [true, 'A tour should have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'A difficulty is either: easy, medium or difficult',
      },
    },

    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'rating must be above 1.0'],
      max: [5, 'a rating must be less or below 5.0'],
      set: function (val) {
        math.round(val * 10) / 10; // this is used to round up figures to s whole when displaying ratings average
      },
    },

    ratingsQuantity: {
      type: Number,
      default: 0,
    },

    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },

    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },

        message: 'Discount price should be below regular price',
      },
    },

    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },

    description: {
      type: {
        String,
        trim: true,
      },
    },

    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },

    images: [String],
    createdAt: {
      type: Date,
      default: new Date(),
      select: false,//to not display this field when being queried in db
    },

    startDates: [Date],

    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //GeoJSON
      types: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    location: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJson: { virtuals: true },
    toObject: { virtuals: true },
  }
);
//indexing help to reduce number of documents to be scanned when a query is made
//to use this function, think of request that are likely more queried and then add to index
//tourSchema.index({ price:1 })//1 for ascending while -1 for descending
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//virtual populate(to displaying the reviews(ids) attached to a particular tour id)
tourSchema.virtual('reviews', {
  ref: 'Review',// here in the tour model we referencing the review model to this 
  foreignField: 'tour', //to the review model, tour is the foreign field needed to 
  localField: '_id',// to the review model, the tour _id is the local id.
});

//Document Middleware:: runs before .save() and .create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});
//to save find, add and save tour guides id(s) to DB whenever a new tour is being created.
// //embedded style
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async function (id) {
//     await User.findById(id);
//   });
//   this.guides = await Promise.all(guidesPromises);

//   next();
// }); //this piece of code to be commented out

tourSchema.pre(/^find/, function (next) {
  //this query middleware is to populate(display details) of fields or data of referenced user.
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt', // this fields will be excluded when displaying details
  });

  next();
});
tourSchema.post('save', function (doc, next) {
  console.log(doc);
  next();
});

//Query Middleware --  a better way to query middleware
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = new Date();
  next();
});

//query Midddleware
// tourSchema.pre('find', function (next) {
//   this.find({ secretTour: { $ne: true } });

//   this.start = new Date();

//   next();
// });

tourSchema.post(/^find/, function (docs, next) {
  console.log(`it took ${new Date() - this.start} milleseconds! `);
  console.log(docs);
  next();
});

//aggregation middleware
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

  console.log(this.pipeline);
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
