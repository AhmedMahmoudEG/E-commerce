const Product = require("../models/productModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const ApiFeatures = require("../utils/apiFeatures");
const filterObject = require("../utils/filterObject");
const parseNested = require("../utils/parseNestedJson");
const { calculateCurrentPrice } = require("../utils/calculateCurrentPrice");
const {
  handleProductImages,
  deleteMediaImages,
} = require("../utils/cloudinary");

const ALLOWED_PRODUCT_FIELDS = [
  "sku",
  "model",
  "name",
  "short_description",
  "description",
  "brand",
  "variant_of",
  "price",
  "stock_quantity",
  "is_active",
  "categories",
  "attributes",
  "meta",
];
exports.getAllProducts = catchAsync(async (req, res, next) => {
  const features = await new ApiFeatures(Product.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const products = await features.query;
  res.status(200).json({
    message: "success",
    data: { products },
  });
});
exports.getProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new AppError("Product not found", 404));
  }
  res.status(200).json({
    message: "success",
    data: { product },
  });
});

exports.createProduct = catchAsync(async (req, res, next) => {
  const filteredBody = filterObject(req.body, ALLOWED_PRODUCT_FIELDS);
  // Parse nested JSON fields (if they come as strings)
  // Parse nested JSON fields that come as strings from form-data
  const jsonFields = [
    "name",
    "short_description",
    "description",
    "brand",
    "price",
    "categories",
    "attributes",
    "meta",
  ];
  try {
    const parsedBody = parseNested.parseJsonFields(filteredBody, jsonFields);
    Object.assign(filteredBody, parsedBody);
  } catch (error) {
    return next(new AppError(error.message, 400));
  }
  // Handle image uploads - works with both req.files and req.file
  let mediaArray = [];

  // main image (single file)
  if (req.files && req.files.mainImage) {
    const mainImage = await handleProductImages(
      req.files.mainImage,
      "products"
    );
    if (mainImage.length > 0) {
      mainImage[0].type = "main";
      mainImage[0].sort_order = 0;
      mediaArray.push(mainImage[0]);
    }
  }

  // gallery images/videos (multiple files)
  if (req.files && req.files.gallery) {
    const gallery = await handleProductImages(req.files.gallery, "products");
    gallery.forEach((m, i) => {
      m.type = m.resource_type === "video" ? "video" : "gallery";
      m.sort_order = i + 1;
    });
    mediaArray = mediaArray.concat(gallery);
  }
  if (mediaArray.length > 0) {
    filteredBody.media = mediaArray;
  }
  // Calculate current price
  if (filteredBody.price) {
    filteredBody.price = calculateCurrentPrice(filteredBody.price);
  }
  const prodcut = await Product.create(filteredBody);
  res.status(201).json({
    message: "success",
    data: { prodcut },
  });
});
exports.updateProduct = catchAsync(async (req, res, next) => {});
exports.deleteProduct = catchAsync(async (req, res, next) => {});
exports.getRelatedProducts = catchAsync(async (req, res, next) => {});
exports.getProductReviews = catchAsync(async (req, res, next) => {});
