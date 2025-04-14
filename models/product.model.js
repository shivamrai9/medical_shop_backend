import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Provide medicine name"],
    },
    image: {
      type: [String],
      default: [],
    },
    category: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "category", // e.g., Antibiotics, Painkillers
      },
    ],
    subCategory: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "category", // e.g., Oral, Injectable
      },
    ],
    dosage: {
      // New field for dosage info
      type: String,
      default: "",
    },
    stock: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      default: null,
    },
    discount: {
      type: Number,
      default: null,
    },
    description: {
      type: String,
      default: "",
    },
    manufacturer: {
      // New field for medicine manufacturer
      type: String,
      default: "",
    },
    prescription_required: {
      // New field to enforce prescription
      type: Boolean,
      default: false,
    },
    expiry_date: {
      // New field for medicine expiry
      type: Date,
      default: null,
    },
    publish: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Create a text index for search
productSchema.index(
  {
    name: "text",
    description: "text",
    manufacturer: "text",
  },
  {
    weights: {
      name: 10,
      description: 5,
      manufacturer: 3,
    },
  }
);

const ProductModel = mongoose.model("product", productSchema);
export default ProductModel;
