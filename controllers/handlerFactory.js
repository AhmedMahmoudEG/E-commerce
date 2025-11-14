const AppError = require("../utils/appError");
const CatchAsync = require("../utils/catchAsync");
const APIFeatures = require("../utils/apiFeatures");

exports.deleteOne = (Model) =>
  CatchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) return next(new AppError(`No Document Found with this ID`), 404);
    res.status(204).json({
      status: "success",
      message: `document deleted successfully!`,
      data: null,
    });
  });
exports.createOne = (Model) =>
  CatchAsync(async (req, res, next) => {
    const doc = await Model.createOne(req.body);
    res.status(201).json({
      status: "success",
      message: "A new doc has been created",
      data: { doc },
    });
  });
exports.updateOne = (Model) =>
  CatchAsync(async (req, res, next) => {
    const updateDoc = await Model.findByIdAndUpate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updateDoc) return next(new AppError(`No doc with this id`), 404);
    res.status(200).json({
      status: "success",
      message: "doc has been updated",
      data: { updateDoc },
    });
  });

exports.getOne = (Model, popOptions) =>
  CatchAsync(async (req, res, next) => {
    const query = await Model.findById(req.params.id);
    if (popOptions) await query.populate(popOptions);
    const doc = await query;
    if (!doc) return next(new AppError(`there's no document for this id`), 400);
    res.status(200).json({
      status: "success",
      data: { doc },
    });
  });
exports.getAll = (Model) =>
  CatchAsync(async (req, res, next) => {
    let filter = {};
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .limitFields()
      .paginate()
      .sort();
    const docs = await features.query;

    res.status(200).json({
      status: "success",
      results: docs.length,
      data: { docs },
    });
  });
