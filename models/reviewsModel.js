const mongoose = require("mongoose");

const ReviewSchema = mongoose.Schema({
  id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  review: {
    type: String,
    required: true,
  },
});

const Review = mongoose.model("Review", ReviewSchema);
module.exports = Review;
