const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Brand = require("../models/brandModel");

dotenv.config({ path: "./config.env", debug: false });

process.env.DOTENV_CONFIG_DEBUG = "false";
const brands = JSON.parse(fs.readFileSync(`${__dirname}/brands.json`, "utf-8"));

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);
mongoose.connect(DB).then(() => console.log(`DB connection successful!`));
//import data
const importData = async () => {
  try {
    await Brand.create(brands);
    console.log(`data successfully loaded`);
    process.exit();
  } catch (error) {
    console.log(error);
  }
};
//delete all data from collection
const deleteData = async () => {
  try {
    await Brand.deleteMany();
    console.log("Data deleted Successfully!");
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

console.log(process.argv);
if (process.argv[2] == "--import") {
  importData();
} else if (process.argv[2] == "--delete") {
  deleteData();
}
