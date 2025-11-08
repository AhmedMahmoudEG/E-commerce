import mongoose, { Schema } from "mongoose";

// Sub-Document Schema for Items (Embedded in Order)
const OrderItemSchema = new Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  sku: { type: String, required: true }, // Snapshot data
  name: {
    // 💡 UPDATED: Localized name snapshot
    en: { type: String, required: true },
    ar: { type: String, required: true },
  },
  quantity: { type: Number, required: true, min: 1 },
  unit_price: { type: Number, required: true, min: 0 }, // Price at time of order
  total: { type: Number, required: true, min: 0 },
});

const OrderSchema = new Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Embedded Address Snapshot
    shipping_address: { type: Object, required: true }, // Contains a copy of the Address info

    // Array of Embedded Items
    items: [OrderItemSchema],

    total_amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "SAR" }, // 💡 SUGGESTION: Add currency
    shipping_cost: { type: Number, default: 0 },
    tax_amount: { type: Number, default: 0 },

    // Status and Payment
    status: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
    payment: {
      method: { type: String },
      transaction_id: { type: String, unique: true, sparse: true },
      status: {
        type: String,
        enum: ["Success", "Failed", "Pending"],
        default: "Pending",
      },
    },
  },
  { timestamps: true }
);
const Order = mongoose.model("Order", OrderSchema);
module.exports = Order;
