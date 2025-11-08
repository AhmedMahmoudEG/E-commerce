const mongoose = require("mongoose");
const { Schema } = mongoose;

// New Model: ProductService (for add-ons like installation, frames, etc.)
const ProductServiceSchema = new Schema(
  {
    name: {
      en: { type: String, required: true },
      ar: { type: String, required: true },
    },
    description: {
      en: { type: String },
      ar: { type: String },
    },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "SAR" },
    // This allows you to associate this service with specific product categories
    applicable_categories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const ProductService = mongoose.model("ProductService", ProductServiceSchema);
module.exports = ProductService;
