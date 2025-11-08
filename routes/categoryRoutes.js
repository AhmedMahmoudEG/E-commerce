const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const authController = require("../controllers/authController");
const { upload } = require("../utils/cloudinary");
router.get("/", categoryController.getAllCatergories);
//get categories as tree
router.get("/tree", categoryController.getCategoryTree); //supports parent=ID
router.get("/:id", categoryController.getOneCategory);

// ---------- Protected Routes (Admin only) ----------
router.use(authController.protect, authController.restrictTo("admin"));
router.post("/", upload.single("image"), categoryController.createCategory);
router.patch("/:id", upload.single("image"), categoryController.updateCategory);
router.delete("/:id", categoryController.deleteCategory);

module.exports = router;
