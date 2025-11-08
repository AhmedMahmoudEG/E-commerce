const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { Readable } = require("stream");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage instead of disk
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed!"), false);
    }
  },
});

/**
 * Upload single buffer to Cloudinary
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {String} folder - Cloudinary folder name
 * @param {Object} options - Additional Cloudinary options
 * @returns {Promise} Cloudinary upload result
 */
const uploadToCloudinary = (fileBuffer, folder = "brands", options = {}) => {
  return new Promise((resolve, reject) => {
    const defaultOptions = {
      folder: folder,
      transformation: [{ width: 500, height: 500, crop: "limit" }],
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      { ...defaultOptions, ...options },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    // Convert buffer to stream and pipe to Cloudinary
    const readableStream = Readable.from(fileBuffer);
    readableStream.pipe(uploadStream);
  });
};

/**
 * Upload multiple images to Cloudinary
 * @param {Array} files - Array of multer file objects (req.files)
 * @param {String} folder - Cloudinary folder name
 * @param {Object} options - Additional Cloudinary options
 * @returns {Promise<Array>} Array of Cloudinary upload results
 */
const uploadMultipleToCloudinary = async (
  files,
  folder = "products",
  options = {}
) => {
  if (!files || files.length === 0) {
    return [];
  }

  const uploadPromises = files.map((file, index) => {
    return uploadToCloudinary(file.buffer, folder, {
      ...options,
      // You can add custom public_id or other options here
      // public_id: `${folder}_${Date.now()}_${index}`,
    });
  });

  return Promise.all(uploadPromises);
};

/**
 * Handle image uploads with media array formatting for products
 * @param {Array|Object} files - req.files (array) or req.file (single)
 * @param {String} folder - Cloudinary folder name
 * @returns {Promise<Array>} Formatted media array for product schema
 */
const handleProductImages = async (files, folder = "products") => {
  const mediaArray = [];

  // Handle multiple files (req.files)
  if (Array.isArray(files) && files.length > 0) {
    const results = await uploadMultipleToCloudinary(files, folder);

    results.forEach((result, index) => {
      mediaArray.push({
        url: result.secure_url,
        type: index === 0 ? "main" : "gallery",
        sort_order: index,
      });
    });
  }
  // Handle single file (req.file)
  else if (files && files.buffer) {
    const result = await uploadToCloudinary(files.buffer, folder);
    mediaArray.push({
      url: result.secure_url,
      type: "main",
      sort_order: 0,
    });
  }

  return mediaArray;
};

/**
 * Delete single image from Cloudinary
 * @param {String} publicId - Cloudinary public ID
 * @returns {Promise} Cloudinary delete result
 */
const deleteFromCloudinary = (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};

/**
 * Delete multiple images from Cloudinary
 * @param {Array} publicIds - Array of Cloudinary public IDs
 * @returns {Promise<Array>} Array of delete results
 */
const deleteMultipleFromCloudinary = async (publicIds) => {
  if (!publicIds || publicIds.length === 0) {
    return [];
  }

  const deletePromises = publicIds.map((publicId) => {
    return deleteFromCloudinary(publicId);
  });

  return Promise.all(deletePromises);
};

/**
 * Delete images from media array
 * @param {Array} mediaArray - Array of media objects with url property
 * @returns {Promise<Array>} Array of delete results
 */
const deleteMediaImages = async (mediaArray) => {
  if (!mediaArray || mediaArray.length === 0) {
    return [];
  }

  const publicIds = mediaArray
    .map((media) => getPublicIdFromUrl(media.url))
    .filter((id) => id !== null);

  return deleteMultipleFromCloudinary(publicIds);
};

/**
 * Extract Cloudinary public ID from URL
 * @param {String} url - Cloudinary URL
 * @returns {String} Public ID or null
 */
const getPublicIdFromUrl = (url) => {
  if (!url) return null;

  try {
    // Example: https://res.cloudinary.com/demo/image/upload/v1234567890/brands/samsung.jpg
    const parts = url.split("/");
    const uploadIndex = parts.indexOf("upload");

    if (uploadIndex === -1) return null;

    // Get everything after 'upload/v123456789/'
    const pathAfterVersion = parts.slice(uploadIndex + 2).join("/");

    // Remove file extension
    return pathAfterVersion.replace(/\.[^/.]+$/, "");
  } catch (error) {
    console.error("Error extracting public ID:", error);
    return null;
  }
};

module.exports = {
  cloudinary,
  upload,
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  handleProductImages,
  deleteFromCloudinary,
  deleteMultipleFromCloudinary,
  deleteMediaImages,
  getPublicIdFromUrl,
};
