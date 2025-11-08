const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { Schema } = mongoose;
const validator = require("validator");
// Sub-Document Schema for Addresses
const AddressSchema = new Schema({
  region_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Region",
    required: [true, "Region ID is required"],
  },
  area_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Area",
    required: [true, "Area ID is required"],
  },
  street_address: {
    type: String,
    required: [true, "Street address is required"],
    trim: true,
    minlength: [5, "Street address must be at least 5 characters"],
  },
  zip_code: {
    type: String,
    validate: {
      validator: (val) => /^[0-9]{5,10}$/.test(val),
      message: "Invalid ZIP code format",
    },
  },
  is_default: { type: Boolean, default: false },
});

// Main User Schema

const UserSchema = new Schema(
  {
    first_name: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [2, "First name must be at least 2 characters"],
      maxlength: [30, "First name must be less than 30 characters"],
    },
    last_name: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: [2, "Last name must be at least 2 characters"],
      maxlength: [30, "Last name must be less than 30 characters"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
      validate: {
        validator: (val) => /^(\+?\d{1,3}[- ]?)?\d{10,15}$/.test(val),
        message: "Invalid phone number format",
      },
    },

    // 🔹 Login Info
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      select: false, // hide password in queries
      validate: {
        validator: function (val) {
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(val);
        },
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      },
    },
    passwordConfirm: {
      type: String,
      required: [true, "Please confirm your password"],
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: "Passwords do not match",
      },
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    passwordChangedAt: Date,
    // 🔹 System Info
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
    addresses: [AddressSchema],
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    // 🔹 OTP & Verification
    is_verified: { type: Boolean, default: false },
    otp: { type: String },
    otp_expires: { type: Date },
  },
  { timestamps: true }
);
// Hash password and remove passwordConfirm before saving
UserSchema.pre("save", async function (next) {
  // only hash if password was modified
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});
// Update passwordChangedAt when password changes
UserSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

//check if password is correct
UserSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};
//checks whether the user changed their password after a JWT token was issued
UserSchema.methods.changePasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimeStamp < changedTimeStamp;
  }
  return false;
};
//create reset token to rest the password if the user forget it
UserSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};
const User = mongoose.model("User", UserSchema);
module.exports = User;
