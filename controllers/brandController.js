const Brand = require("../models/brandModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const ApiFeatures = require("../utils/apiFeatures");
const filterObject = require("../utils/filterObject");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl,
} = require("../utils/cloudinary");

const ALLOWED_BRAND_FIELDS = ["name", "description", "is_featured"];

exports.getAllBrands = catchAsync(async (req, res, next) => {
  const features = new ApiFeatures(Brand.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const brands = await features.query;
  res.status(200).json({ message: "success", data: { brands } });
});

exports.getBrand = catchAsync(async (req, res, next) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) {
    return next(new AppError("Brand not found", 404));
  }
  res.status(200).json({ message: "success", data: { brand } });
});

exports.createBrand = catchAsync(async (req, res, next) => {
  const filteredBody = filterObject(req.body, ALLOWED_BRAND_FIELDS);

  // Parse nested JSON fields (name, description)
  if (typeof req.body.name === "string") {
    filteredBody.name = JSON.parse(req.body.name);
  }
  if (typeof req.body.description === "string") {
    filteredBody.description = JSON.parse(req.body.description);
  }

  // Upload logo to Cloudinary if file exists
  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, "brands");
    filteredBody.logo_url = result.secure_url;
  }

  const brand = await Brand.create(filteredBody);
  res.status(201).json({ message: "success", data: { brand } });
});

exports.updateBrand = catchAsync(async (req, res, next) => {
  const filteredBody = filterObject(req.body, ALLOWED_BRAND_FIELDS);

  // Parse nested JSON fields
  if (typeof req.body.name === "string") {
    filteredBody.name = JSON.parse(req.body.name);
  }
  if (typeof req.body.description === "string") {
    filteredBody.description = JSON.parse(req.body.description);
  }

  const brand = await Brand.findById(req.params.id);

  if (!brand) {
    return next(new AppError("Brand not found", 404));
  }

  // Handle logo upload
  if (req.file) {
    // Delete old logo from Cloudinary
    if (brand.logo_url) {
      const publicId = getPublicIdFromUrl(brand.logo_url);
      if (publicId) {
        await deleteFromCloudinary(publicId);
      }
    }

    // Upload new logo
    const result = await uploadToCloudinary(req.file.buffer, "brands");
    filteredBody.logo_url = result.secure_url;
  }

  Object.assign(brand, filteredBody);

  if (filteredBody.name) {
    brand.slug = undefined;
  }

  await brand.save();

  res.status(200).json({ message: "success", data: { brand } });
});

exports.deleteBrand = catchAsync(async (req, res, next) => {
  const deletedBrand = await Brand.findByIdAndDelete(req.params.id);

  if (!deletedBrand) {
    return next(new AppError("Brand not found", 404));
  }

  // Delete logo from Cloudinary
  if (deletedBrand.logo_url) {
    const publicId = getPublicIdFromUrl(deletedBrand.logo_url);
    if (publicId) {
      await deleteFromCloudinary(publicId);
    }
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getFeaturedBrands = catchAsync(async (req, res, next) => {
  const featuredBrands = await Brand.find({ is_featured: true });
  res.status(200).json({ message: "success", data: { featuredBrands } });
});
