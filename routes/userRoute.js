const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
router.post("/signup", authController.signup);
router.post("/verifyEmail", authController.verifyEmail);
router.post("/login", authController.login);
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);
router.post("/logout", authController.logOut);
router.patch(
  "/updateMyPassword",
  authController.protect,
  authController.updatePassword
);
router.use(authController.protect);
router.use(authController.restrictTo("admin"));
router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUser);
router.post("/", userController.createUser);
router.patch("/:id", userController.updateUser);
module.exports = router;
