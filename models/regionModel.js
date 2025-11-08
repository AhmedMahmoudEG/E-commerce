const mongoose = require("mongoose");

// New Model: Region (or City)
const RegionSchema = new mongoose.Schema(
  {
    name: {
      en: { type: String, required: true },
      ar: { type: String, required: true },
    },
    // The ID from the source data, useful for mapping during data import
    source_id: { type: String, required: true, unique: true },
    country_code: { type: String, required: true, default: "EG" },
    is_active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

const Region = mongoose.model("Region", RegionSchema);
module.exports = Region;
