import ProductModel from "../models/product.model.js";
import CategoryModel from "../models/category.model.js";
import uploadImageClodinary from "../utils/uploadImageClodinary.js";

export const createProduct = async (req, res) => {

  console.log("Body:", req.body);
  console.log("Files length:", req.files?.length);

  try {
    let {
      name,
      category = [],
      subCategory = [],
      dosage = "",
      stock = 0,
      price = null,
      discount = null,
      description = "",
      manufacturer = "",
      prescription_required = false,
      expiry_date = null,
      publish = true,
      createdBy,
    } = req.body;

    // 🧠 Parse stringified category/subCategory if sent from form-data
    if (typeof category === "string") category = JSON.parse(category);
    if (typeof subCategory === "string") subCategory = JSON.parse(subCategory);

    // 🛑 Check for required fields
    if (!name || !category || category.length === 0) {
      return res.status(400).json({
        message: "Medicine name and at least one category are required.",
        success: false,
      });
    }

    // 🔥 Image Upload to Cloudinary
    let image = [];
    console.log(req.files,"///////////////////////////////////////////////////////////");
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        uploadImageClodinary(file)
      );
      const uploadedImages = await Promise.all(uploadPromises);

      image = uploadedImages
        .filter((img) => img?.secure_url)
        .map((img) => img.secure_url);
    }

    // ✅ Validate category IDs
    const validCategories = await CategoryModel.find({
      _id: { $in: category },
    });

    if (validCategories.length !== category.length) {
      return res.status(400).json({
        message: "Some category IDs are invalid.",
        success: false,
      });
    }

    // ✅ Validate subCategory IDs if provided
    if (subCategory.length > 0) {
      const validSubCategories = await CategoryModel.find({
        _id: { $in: subCategory },
      });

      if (validSubCategories.length !== subCategory.length) {
        return res.status(400).json({
          message: "Some subCategory IDs are invalid.",
          success: false,
        });
      }

      // 🔄 Check if subCategory belongs to selected parent category
      const mismatchedSubs = validSubCategories.filter(
        (sub) => !category.includes(sub.parentCategory?.toString())
      );

      if (mismatchedSubs.length > 0) {
        return res.status(400).json({
          message: "Some subcategories do not belong to the selected category.",
          success: false,
        });
      }
    }

    // ✅ Save product to DB
    const newProduct = new ProductModel({
      name,
      image,
      category,
      subCategory,
      dosage,
      stock,
      price,
      discount,
      description,
      manufacturer,
      prescription_required,
      expiry_date,
      publish,
      createdBy,
    });

    const savedProduct = await newProduct.save();

    return res.status(201).json({
      message: "Product created successfully",
      success: true,
      data: savedProduct,
    });
  } catch (error) {
    console.error("Error in createProduct:", error);
    return res.status(500).json({
      message: error.message || "Server error while creating product",
      success: false,
    });
  }
};

export const getProductController = async (request, response) => {
  try {
    let { page, limit, search } = request.query;

    page = page || 1;
    limit = limit || 10;

    const currentDate = new Date();


    const query = {
      ...(search && { $text: { $search: search } }),
      stock: { $gt: 0 }, // Only in-stock medicines
      expiry_date: { $gt: currentDate }, // Non-expired medicines
      publish: true, // Only published medicines
    };

    const skip = (page - 1) * limit;

    const [data, totalCount] = await Promise.all([
      ProductModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("category subCategory"),
      ProductModel.countDocuments(query),
    ]);

    return response.json({
      message: "Medicine data retrieved",
      error: false,
      success: true,
      totalCount,
      totalNoPage: Math.ceil(totalCount / limit),
      data,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || "Server error fetching medicines",
      error: true,
      success: false,
    });
  }
};

export const getProductByCategory = async (req, res) => {
  try {
    const { categoryId, page = 1, limit = 15 } = req.body;

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category ID is required",
      });
    }

    const currentDate = new Date();
    const skip = (page - 1) * limit;

    const filter = {
      category: categoryId,
      stock: { $gt: 0 },
      expiry_date: { $gt: currentDate },
      publish: true,
    };

    const [products, totalCount] = await Promise.all([
      ProductModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      ProductModel.countDocuments(filter),
    ]);

    res.json({
      success: true,
      message: "Products by category",
      data: products,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};


export const getProductsBySubCategory = async (req, res) => {
  try {
    const { subCategoryId, limit = 15 } = req.body;

    if (!subCategoryId) {
      return res.status(400).json({
        success: false,
        message: "Subcategory ID is required",
      });
    }

    const currentDate = new Date();

    const products = await ProductModel.find({
      subCategory: subCategoryId,
      stock: { $gt: 0 },
      expiry_date: { $gt: currentDate },
      publish: true,
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      message: "Products by subcategory",
      data: products,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};


export const getProductByCategoryAndSubCategory = async (request, response) => {
  try {
    const { categoryId, subCategoryId, page, limit } = request.body;

    if (!categoryId || !subCategoryId) {
      return response.status(400).json({
        message: "Provide categoryId and subCategoryId",
        error: true,
        success: false,
      });
    }

    page = page || 1;
    limit = limit || 10;

    const currentDate = new Date();

    const query = {
      category: { $in: [categoryId] },
      subCategory: { $in: [subCategoryId] },
      stock: { $gt: 0 },
      expiry_date: { $gt: currentDate },
      publish: true,
    };

    const skip = (page - 1) * limit;

    const [data, dataCount] = await Promise.all([
      ProductModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      ProductModel.countDocuments(query),
    ]);

    return response.json({
      message: "Medicines list",
      data,
      totalCount: dataCount,
      page,
      limit,
      success: true,
      error: false,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || "Server error fetching medicines",
      error: true,
      success: false,
    });
  }
};

export const getProductDetails = async (request, response) => {
  try {
    const { productId } = request.body;

    if (!productId) {
      return response.status(400).json({
        message: "Provide productId",
        error: true,
        success: false,
      });
    }

    const currentDate = new Date();

    const product = await ProductModel.findOne({
      _id: productId,
      stock: { $gt: 0 },
      expiry_date: { $gt: currentDate },
      publish: true,
    }).populate("category subCategory");

    if (!product) {
      return response.status(404).json({
        message: "Medicine not found or unavailable",
        error: true,
        success: false,
      });
    }

    return response.json({
      message: "Medicine details",
      data: product,
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || "Server error fetching medicine details",
      error: true,
      success: false,
    });
  }
};

//update product
export const updateProductDetails = async (request, response) => {
  try {
    const { _id } = request.body;
    const { ...updateData } = request.body;

    if (!_id) {
      return response.status(400).json({
        message: "Provide product _id",
        error: true,
        success: false,
      });
    }

    // Prevent updating prescription_required unless explicitly allowed (e.g., by admin)
    if (updateData.prescription_required !== undefined) {
      delete updateData.prescription_required; // Add admin check in future
    }

    // Validate expiry_date if provided
    if (
      updateData.expiry_date &&
      new Date(updateData.expiry_date) <= new Date()
    ) {
      return response.status(400).json({
        message: "Expiry date must be in the future",
        error: true,
        success: false,
      });
    }

    const updateProduct = await ProductModel.findByIdAndUpdate(
      { _id },
      { $set: updateData },
      { new: true }
    );

    if (updateProduct.nModified === 0) {
      return response.status(404).json({
        message: "Medicine not found or no changes made",
        error: true,
        success: false,
      });
    }

    return response.json({
      message: "Medicine updated successfully",
      data: updateProduct,
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || "Server error updating medicine",
      error: true,
      success: false,
    });
  }
};

//delete product
export const deleteProductDetails = async (request, response) => {
  try {
    const { _id } = request.body;

    if (!_id) {
      return response.status(400).json({
        message: "Provide product _id",
        error: true,
        success: false,
      });
    }

    const deleteProduct = await ProductModel.deleteOne({ _id });

    if (deleteProduct.deletedCount === 0) {
      return response.status(404).json({
        message: "Medicine not found",
        error: true,
        success: false,
      });
    }

    return response.json({
      message: "Medicine deleted successfully",
      error: false,
      success: true,
      data: deleteProduct,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || "Server error deleting medicine",
      error: true,
      success: false,
    });
  }
};

//search product
export const searchProduct = async (request, response) => {
  try {
    let { search, page, limit } = request.body;

    page = page || 1;
    limit = limit || 10;

    const currentDate = new Date();

    const query = {
      ...(search && { $text: { $search: search } }),
      stock: { $gt: 0 },
      expiry_date: { $gt: currentDate },
      publish: true,
    };

    const skip = (page - 1) * limit;

    const [data, dataCount] = await Promise.all([
      ProductModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("category subCategory"),
      ProductModel.countDocuments(query),
    ]);

    return response.json({
      message: "Medicine search results",
      error: false,
      success: true,
      data,
      totalCount: dataCount,
      totalPage: Math.ceil(dataCount / limit),
      page,
      limit,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || "Server error searching medicines",
      error: true,
      success: false,
    });
  }
};
