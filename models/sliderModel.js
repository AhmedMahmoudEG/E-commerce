const mongoose = require("mongoose");
const { Schema } = mongoose;

// New Model: Slider (or Banner)
const SliderSchema = new Schema({
  // 💡 SUGGESTION: Localize title and images
  title: {
    en: { type: String },
    ar: { type: String },
  },
  url: { type: String, required: true }, // The link when clicking the banner
  image: {
    en: { type: String, required: true }, // URL for desktop image (en)
    ar: { type: String, required: true }, // URL for desktop image (ar)
  },
  mobile_image: {
    en: { type: String }, // URL for mobile image (en)
    ar: { type: String }, // URL for mobile image (ar)
  },
  sort_order: { type: Number, default: 0, index: true },
  is_active: { type: Boolean, default: true },
});

const Slider = mongoose.model("Slider", SliderSchema);
module.exports = Slider;
