const express = require("express");
const router = express.Router();
const brandController = require("../controllers/brandController");
const authController = require("../controllers/authController");
const { upload } = require("../utils/cloudinary");

// Public routes
router.get("/featured", brandController.getFeaturedBrands);

router
  .route("/")
  .get(brandController.getAllBrands)
  .post(
    authController.protect,
    authController.restrictTo("admin"),
    upload.single("logo"),
    brandController.createBrand
  );

router
  .route("/:id")
  .get(brandController.getBrand)
  .patch(
    // Changed from PUT to PATCH (more RESTful for partial updates)
    authController.protect,
    authController.restrictTo("admin"),
    upload.single("logo"),
    brandController.updateBrand
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin"),
    brandController.deleteBrand
  );

module.exports = router;
