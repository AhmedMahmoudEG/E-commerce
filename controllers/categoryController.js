const Category = require("../models/categoryModel");
const ApiFeatures = require("../utils/apiFeatures");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const filterObject = require("../utils/filterObject");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl,
} = require("../utils/cloudinary");

const ALLOWED_CATEGORY_FIELDS = [
  "name",
  "parent_category_id",
  "sort_order",
  "is_active",
];

exports.getAllCatergories = catchAsync(async (req, res, next) => {
  const features = new ApiFeatures(Category.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const categories = await features.query;
  res.status(200).json({
    status: "success",
    results: categories.length,
    data: { categories },
  });
});

exports.getOneCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return next(new AppError("No category found with that ID", 404));
  }
  res.status(200).json({
    status: "success",
    data: { category },
  });
});

exports.createCategory = catchAsync(async (req, res, next) => {
  const filteredBody = filterObject(req.body, ALLOWED_CATEGORY_FIELDS);

  // Parse nested JSON fields (name)
  if (typeof req.body.name === "string") {
    try {
      filteredBody.name = JSON.parse(req.body.name);
    } catch (error) {
      return next(new AppError("Invalid JSON format for name field", 400));
    }
  }

  // Upload image to Cloudinary if file exists
  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, "categories");
    filteredBody.image_url = result.secure_url;
  }

  const category = await Category.create(filteredBody);
  res.status(201).json({ status: "success", data: { category } });
});

exports.updateCategory = catchAsync(async (req, res, next) => {
  const filteredBody = filterObject(req.body, ALLOWED_CATEGORY_FIELDS);

  // Parse nested JSON fields
  if (typeof req.body.name === "string") {
    try {
      filteredBody.name = JSON.parse(req.body.name);
    } catch (error) {
      return next(new AppError("Invalid JSON format for name field", 400));
    }
  }

  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new AppError("No category found with that ID", 404));
  }

  // Handle image upload
  if (req.file) {
    // Delete old image from Cloudinary
    if (category.image_url) {
      const publicId = getPublicIdFromUrl(category.image_url);
      if (publicId) {
        await deleteFromCloudinary(publicId);
      }
    }

    // Upload new image
    const result = await uploadToCloudinary(req.file.buffer, "categories");
    filteredBody.image_url = result.secure_url;
  }

  Object.assign(category, filteredBody);

  // Regenerate slug if name changed
  if (filteredBody.name && filteredBody.name.en) {
    category.slug = undefined; // Let middleware regenerate
  }

  await category.save();

  res.status(200).json({
    status: "success",
    data: { category },
  });
});

exports.deleteCategory = catchAsync(async (req, res, next) => {
  const deletedCategory = await Category.findById(req.params.id);

  if (!deletedCategory) {
    return next(new AppError("No category found with that ID", 404));
  }

  // Delete image from Cloudinary
  if (deletedCategory.image_url) {
    const publicId = getPublicIdFromUrl(deletedCategory.image_url);
    if (publicId) {
      await deleteFromCloudinary(publicId);
    }
  }

  // Delete the category (triggers pre middleware for cascading)
  await deletedCategory.deleteOne();

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getCategoryTree = catchAsync(async (req, res, next) => {
  const { parent } = req.query;
  const categories = await Category.find().lean();

  const buildTree = (parentId = null) => {
    return categories
      .filter((cat) => String(cat.parent_category_id) === String(parentId))
      .map((cat) => ({
        ...cat,
        children: buildTree(cat._id),
      }));
  };

  let tree;
  if (parent) {
    const rootCategory = categories.find(
      (cat) => String(cat._id) === String(parent)
    );
    if (!rootCategory) {
      return next(new AppError("Category not found", 404));
    }
    tree = {
      ...rootCategory,
      children: buildTree(rootCategory._id),
    };
  } else {
    tree = buildTree(null);
  }

  res.status(200).json({
    status: "success",
    data: { categories: tree },
  });
});
