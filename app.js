const express = require("express");
require("dotenv").config(); // Load environment variables from .env file
const passport = require("passport");
const cookieParser = require("cookie-parser");
const oauthRouter = require("./routes/oauthRoutes");
const categoryRouter = require("./routes/categoryRoutes");
const brandRouter = require("./routes/brandRoute");
const productRouter = require("./routes/productRoute");
const morgan = require("morgan");
const app = express();
app.use(cookieParser());
app.use(passport.initialize());
app.use(morgan("dev"));
const userRouter = require("./routes/userRoute");
const bodyParser = require("body-parser");

// Use body-parser to handle JSON payloads
app.use(bodyParser.json());

app.use(express.urlencoded({ extended: true }));
app.use("/api/v1/users", userRouter);
app.use("/api/v1/auth", oauthRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/brands", brandRouter);
app.use("/api/v1/products", productRouter);
// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({
    status: "failed",
    message: `Cannot find ${req.originalUrl} on this server!`,
  });
});

module.exports = app;
