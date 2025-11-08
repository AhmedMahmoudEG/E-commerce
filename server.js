process.env.DOTENV_QUIET = "true";
const mongoose = require("mongoose");

const dotenv = require("dotenv");
dotenv.config({ path: "./config.env", debug: false });

process.on("uncaughtException", (err) => {
  console.log(err.name, err.message, err.stack);
  console.log("unhandled exception... shutting down ");
  process.exit(1);
});

const app = require("./app");
process.env.DOTENV_CONFIG_DEBUG = "false";
const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);
mongoose.connect(DB).then(() => console.log(`DB connection successful!`));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("unhandled rejection... shutting down ");
  server.close(() => {
    process.exit(1);
  });
});
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully");
  shutdown("SIGTERM");
});
process.on("SIGINT", () => shutdown("SIGINT"));
