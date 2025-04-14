import CategoryModel from "../models/category.model.js";



// Create Category or Subcategory
export const createCategory = async (req, res) => {
  try {
    const { name, parentCategory, image } = req.body;

    console.log(name, parentCategory, image);

    const existing = await CategoryModel.findOne({ name });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Category already exists", success: false });
    }

    const category = await CategoryModel.create({
      name,
      parentCategory: parentCategory || null,
      image,
    });

    res.status(201).json({
      message: "Category created successfully",
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

// Get All Categories
export const getAllCategories = async (req, res) => {
  try {
    const categories = await CategoryModel.find().populate(
      "parentCategory",
      "name"
    );

    res.json({
      message: "All categories fetched",
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

// Get Only Parent Categories (top-level)
export const getParentCategories = async (req, res) => {
  try {
    const parents = await CategoryModel.find({ parentCategory: null });

    res.json({
      message: "Parent categories fetched",
      success: true,
      data: parents,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

// Get Subcategories of a Parent
export const getChildCategories = async (req, res) => {
  try {
    const { id } = req.params;

    const children = await CategoryModel.find({ parentCategory: id }).populate(
      "parentCategory",
    );

    res.json({
      message: "Subcategories fetched",
      success: true,
      data: children,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

// Update Category
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, image, parentCategory } = req.body;

    const updated = await CategoryModel.findByIdAndUpdate(
      id,
      { name, image, parentCategory },
      { new: true }
    );

    res.json({
      message: "Category updated successfully",
      success: true,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};

// Delete Category
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;


    const productUsingCategory = await CategoryModel.findOne({ parentCategory: id });
    if (productUsingCategory) {
      return res.status(400).json({
        message: "Cannot delete category with subcategories",
        success: false,
      });
    }

    await CategoryModel.findByIdAndDelete(id);

    res.json({
      message: "Category deleted successfully",
      success: true,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
};
