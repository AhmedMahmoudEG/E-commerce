const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/userModel");
const crypto = require("crypto");
const Email = require("../utils/email");
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.API_URL}/api/v1/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 1. Check if user exists
        let user = await User.findOne({ email: profile.emails[0].value });

        // 2. If not, create one
        if (!user) {
          user = new User({
            first_name: profile.name.givenName,
            last_name: profile.name.familyName,
            email: profile.emails[0].value,
            googleId: profile.id,
            password: crypto.randomBytes(16).toString("hex"), // random password (won’t be used)
            passwordConfirm: crypto.randomBytes(16).toString("hex"),
            role: "customer",
            addresses: [],
            wishlist: [],
            is_verified: true,
          });
          await user.save({ validateBeforeSave: false });
          await new Email(user).sendWelcome();
        }

        // 3. Return user
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

module.exports = passport;
