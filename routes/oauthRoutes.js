const express = require("express");
const passport = require("../config/passport");
const sendToken = require("../utils/jwt");

const router = express.Router();

// Start Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Callback after Google authentication
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    // Now user is authenticated — issue JWT using your own function
    sendToken(req.user, 200, req, res);
  }
);

module.exports = router;
