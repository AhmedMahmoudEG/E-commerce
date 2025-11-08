const mongoose = require("mongoose");
const slugify = require("slugify");

const ProductSchema = new mongoose.Schema(
  {
    // Primary Identifiers
    sku: { type: String, unique: true, trim: true },
    model: { type: String, index: true }, // 💡 ADDED: User-facing model number
    slug: { type: String, unique: true, lowercase: true },
    // Core Data
    name: {
      en: { type: String, required: true },
      ar: { type: String, required: true },
    },
    short_description: {
      // 💡 ADDED
      en: { type: String },
      ar: { type: String },
    },
    description: {
      // 💡 ADDED
      en: { type: String },
      ar: { type: String },
    },

    // Embedded Brand Data (Denormalization for fast product reads)
    brand: {
      brand_id: { type: mongoose.Schema.Types.ObjectId, ref: "Brand" },
      name: { type: String, required: true }, // Embedded copy
    },

    // 💡 ADDED: For product variations (e.g., different colors of the same phone)
    variant_of: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },

    // Pricing & Inventory
    price: {
      base: { type: Number, required: true, min: 0 },
      current: { type: Number, required: true, min: 0 },
      discount_percentage: { type: Number, default: 0, min: 0, max: 100 }, // Added
      currency: { type: String, default: "EGP" },
    },
    stock_quantity: { type: Number, required: true, min: 0, default: 0 },
    is_active: { type: Boolean, default: true },

    // Embedded Media
    media: [
      {
        url: { type: String, required: true },
        type: {
          type: String,
          enum: ["main", "gallery", "video"],
          default: "gallery",
        },
        sort_order: { type: Number, default: 0 },
      },
    ],

    // Category References (Allows one product to belong to multiple categories)
    categories: [
      {
        category_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
          required: true,
        },
        name: { type: String },
        slug: { type: String }, // Added embedded slug
      },
    ],

    // Attributes/Specifications
    attributes: [
      {
        name: {
          // 💡 UPDATED: Localized
          en: { type: String, required: true },
          ar: { type: String, required: true },
        },
        value: {
          // 💡 UPDATED: Localized
          en: { type: String, required: true },
          ar: { type: String, required: true },
        },
      },
    ],
    // SEO / Meta Data (Added)
    meta: {
      title: { en: { type: String }, ar: { type: String } },
      description: { en: { type: String }, ar: { type: String } },
    },

    // Embedded Review Summary
    reviews_summary: {
      avg_rating: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);
//add slugify
ProductSchema.pre("save", function (next) {
  if (!this.slug && this.name && this.name.en) {
    this.slug = slugify(this.name.en, { lower: true, strict: true });
  }
  next();
});
//add sku
ProductSchema.pre("save", async function (next) {
  // Only generate if SKU not provided
  if (!this.sku) {
    const brandPrefix = this.brand?.name
      ? this.brand.name.slice(0, 3).toUpperCase()
      : "PRD";

    const modelPart = this.model
      ? this.model.replace(/\s+/g, "").slice(0, 6).toUpperCase()
      : "GEN";

    // Count existing products to generate sequential SKU
    const count = await mongoose.model("Product").countDocuments();

    this.sku = `${brandPrefix}-${modelPart}-${String(count + 1).padStart(
      3,
      "0"
    )}`;
  }

  // Slugify fallback (keep your existing slug logic)
  if (!this.slug && this.name && this.name.en) {
    this.slug = slugify(this.name.en, { lower: true, strict: true });
  }

  next();
});

// We can add an index to speed up product lookup by brand and category
ProductSchema.index({ "brand.brand_id": 1, "categories.category_id": 1 });
const Product = mongoose.model("Product", ProductSchema);
module.exports = Product;
