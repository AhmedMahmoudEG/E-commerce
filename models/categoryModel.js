const mongoose = require("mongoose");
const slugify = require("slugify");

const CategorySchema = new mongoose.Schema(
  {
    name: {
      en: { type: String, required: true, unique: true },
      ar: { type: String, required: true, unique: true },
    },
    slug: { type: String, unique: true, lowercase: true },
    parent_category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },
    image_url: { type: String },
    sort_order: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Generate slug before saving
CategorySchema.pre("save", function (next) {
  if (!this.slug && this.name && this.name.en) {
    this.slug = slugify(this.name.en, { lower: true, strict: true });
  }
  next();
});

// Handle cascading on delete
CategorySchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    await this.model("Category").updateMany(
      { parent_category_id: this._id },
      { $set: { parent_category_id: null } }
    );
    next();
  }
);

const Category = mongoose.model("Category", CategorySchema);
module.exports = Category;
