const { promisify } = require("util");
const bcrypt = require("bcryptjs");
const Email = require("../utils/email");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const crypto = require("crypto");
const { createUser } = require("./userController");
const sendToken = require("../utils/jwt");

//create new User
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    phone: req.body.phone,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  // 2️⃣ Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  // Hash and store the OTP in DB
  newUser.otp = crypto.createHash("sha256").update(otp).digest("hex");
  newUser.otp_expires = Date.now() + 10 * 60 * 1000; // expires in 10 min
  await newUser.save({ validateBeforeSave: false });
  await new Email(newUser, otp).sendEmailVerification();

  sendToken(newUser, 201, req, res);
});
exports.verifyEmail = catchAsync(async (req, res, next) => {
  const { otp } = req.body;

  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

  const user = await User.findOne({
    otp: hashedOTP,
    otp_expires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Invalid or expired OTP", 400));
  }
  await new Email(user, otp).sendWelcome();
  user.is_verified = true;
  user.otp = undefined;
  user.otp_expires = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    message: "Email verified successfully",
  });
});
exports.resendOTP = catchAsync(async (req, res, next) => {
  //remaining
});
//login user
exports.login = catchAsync(async (req, res, next) => {
  //check if email& password exist
  const { email, password } = req.body;
  if (!email || !password)
    return next(new AppError("Please provide email and password", 400));
  //check if user exist && password is correct
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError("Incorrect email or password", 401));
  //send token
  sendToken(user, 200, req, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  //get the token and check if it exist
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) return next(new AppError("You are not logged in", 401));
  //verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //check if user still exist
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) return next(new AppError("User no longer exist", 401));
  //check if user changed password, after the token was issued
  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password, please log in again!", 401)
    );
  }
  //Granted Access to Protected Route
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

//restrict users
exports.restrictTo = (...roles) => {
  return catchAsync(async (req, res, next) => {
    //roles : admin , lead-guide
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          "you don't have the permission to perform this action",
          403
        )
      );
    }
    next();
  });
};
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(new AppError("There is no user with email address", 404));
  //generate restToken
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  //send it to user
  // Create reset URL to send to the user

  res.status(200).json({
    status: "success",
    data: {
      resetToken,
    },
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // hash the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  // 1) get user based on the token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) return next(new AppError("Token is invalid or has expired", 400));

  // 2) set the new password if token is not expired and user still exists
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // 3) update the changed password for the current user
  await user.save();

  // 4) log the user in (send JWT)
  sendToken(user, 200, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // Validate required fields exist
  if (
    !req.body.passwordCurrent ||
    !req.body.password ||
    !req.body.passwordConfirm
  ) {
    return next(
      new AppError(
        "Please provide current password, new password, and confirm password",
        400
      )
    );
  }

  // 1) get user from collection
  const user = await User.findById(req.user.id).select("+password");

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // 2) check if current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current password is wrong", 401));
  }

  // 3) update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4) log the user in and send jwt
  sendToken(user, 200, req, res);
});
//reset the jwt
exports.logOut = (req, res) => {
  res.cookie("jwt", "Loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: "success",
  });
};
