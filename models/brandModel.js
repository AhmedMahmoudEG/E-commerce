const mongoose = require("mongoose");
const slugify = require("slugify");
const { Schema } = mongoose;
// Brand Model
const BrandSchema = new Schema(
  {
    name: {
      en: { type: String, required: true, unique: true },
      ar: { type: String, required: true, unique: true },
    },
    slug: { type: String, unique: true, lowercase: true },
    logo_url: { type: String },

    description: {
      en: { type: String },
      ar: { type: String },
    },
    is_featured: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);
//create slug when create a new brand
BrandSchema.pre("save", function (next) {
  if (!this.slug && this.name && this.name.en) {
    this.slug = slugify(this.name.en, { lower: true, strict: true });
  }
  next();
});
//if brand's name updated then update the slug
BrandSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (!this.slug && this.name && this.name.en) {
    this.slug = slugify(this.name.en, { lower: true, strict: true });
  }
  next();
});
const Brand = mongoose.model("Brand", BrandSchema);
module.exports = Brand;
