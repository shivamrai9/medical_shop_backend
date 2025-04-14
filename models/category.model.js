import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Provide category name"], // e.g., "Antibiotics"
      unique: true,
    },
    parentCategory: {
      type: mongoose.Schema.ObjectId,
      ref: "category",
      default: null,
    },
    image: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const CategoryModel = mongoose.model("category", categorySchema);
export default CategoryModel;
