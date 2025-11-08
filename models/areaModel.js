const mongoose = require("mongoose");
const { Schema } = mongoose;

// New Model: Area (or District)
const AreaSchema = new Schema(
  {
    name: {
      en: { type: String, required: true },
      ar: { type: String, required: true },
    },
    // Link back to the parent Region/City
    region_id: {
      type: Schema.Types.ObjectId,
      ref: "Region",
      required: true,
      index: true,
    },
    source_id: { type: String, required: true, unique: true }, // city_id from JSON
    extra_shipping_fees: { type: Number, default: 0 },
    extra_installation_fees: { type: Number, default: 0 },
    cod_unavailable: { type: Boolean, default: false }, // Cash on Delivery
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Area = mongoose.model("Area", AreaSchema);
module.exports = Area;
