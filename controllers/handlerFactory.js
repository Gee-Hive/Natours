const catchAsync = require('./../utils/catchAsync');

const APIFeatures = require('./../utils/apiFeatures');

const AppError = require('./../utils/appError');

exports.deleteOne = function (Model) {
  catchAsync(async function (req, res, next) {
    const doc = await Model.findByIdAndDelete(req.params.id);

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
};

exports.updateOne = function (Model) {
  catchAsync(async function (req, res, next) {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
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
};

exports.createOne = function (Model) {
  catchAsync(async function (req, res, next) {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });
};

exports.getOne = function (Model, popOptions) {
  catchAsync(async function (req, res, next) {
    let query = Model.findById(req.params.id);

    if (popOptions) query = query.populate(popOptions);

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
};

exports.getAll = function (Model) {
  catchAsync(async function (req, res, next) {
    //To allow nested Get reviews on tours
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    //executing query
    const features = new APIFeatures(Model.find(filter), req.query)
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
};
