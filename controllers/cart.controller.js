import CartProductModel from "../models/cartproduct.model.js";
import UserModel from "../models/user.model.js";
import ProductModel from "../models/product.model.js"; // Import ProductModel for validation

export const addToCartItemController = async (request, response) => {
  try {
    const userId = request.user.id;
    const { productId, quantity = 1 } = request.body; // Allow quantity in request

    if (!productId) {
      return response.status(400).json({
        message: "Provide productId",
        error: true,
        success: false,
      });
    }

    // Check if product exists, is in stock, and not expired
    const product = await ProductModel.findOne({
      _id: productId,
      stock: { $gte: quantity },
      expiry_date: { $gt: new Date() },
      publish: true,
    });

    if (!product) {
      return response.status(400).json({
        message: "Product unavailable, out of stock, or expired",
        error: true,
        success: false,
      });
    }

    // Check if item already exists in cart
    const checkItemCart = await CartProductModel.findOne({
      userId,
      productId,
    });

    if (checkItemCart) {
      return response.status(400).json({
        message: "Medicine already in cart",
        error: true,
        success: false,
      });
    }

    // Check prescription requirement
    const user = await UserModel.findById(userId);
    if (product.prescription_required && !user.patient_verified) {
      return response.status(403).json({
        message: "Prescription required. Please verify your patient status.",
        error: true,
        success: false,
      });
    }

    const cartItem = new CartProductModel({
      quantity,
      userId,
      productId,
    });
    const save = await cartItem.save();

    // Update user's shopping_cart with cartProduct ID
    await UserModel.updateOne(
      { _id: userId },
      { $push: { shopping_cart: save._id } }
    );

    return response.json({
      data: save,
      message: "Medicine added to cart successfully",
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || "Server error adding to cart",
      error: true,
      success: false,
    });
  }
};

export const getCartItemController = async (request, response) => {
  try {
    const userId = request.userId;

    const cartItems = await CartProductModel.find({ userId }).populate({
      path: "productId",
      match: {
        stock: { $gt: 0 },
        expiry_date: { $gt: new Date() },
        publish: true,
      },
      select: "-more_details", // Exclude heavy fields if needed
    });

    // Filter out items where product is no longer valid
    const validCartItems = cartItems.filter((item) => item.productId !== null);

    return response.json({
      data: validCartItems,
      message: "Cart items retrieved successfully",
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || "Server error fetching cart items",
      error: true,
      success: false,
    });
  }
};

export const updateCartItemQtyController = async (request, response) => {
  try {
    const userId = request.userId;
    const { _id, qty } = request.body;

    if (!_id || !qty || qty < 1) {
      return response.status(400).json({
        message: "Provide _id and a valid qty (minimum 1)",
        error: true,
        success: false,
      });
    }

    const cartItem = await CartProductModel.findOne({ _id, userId });
    if (!cartItem) {
      return response.status(404).json({
        message: "Cart item not found",
        error: true,
        success: false,
      });
    }

    const product = await ProductModel.findOne({
      _id: cartItem.productId,
      stock: { $gte: qty },
      expiry_date: { $gt: new Date() },
      publish: true,
    });

    if (!product) {
      return response.status(400).json({
        message: "Insufficient stock or medicine unavailable",
        error: true,
        success: false,
      });
    }

    const updateCartItem = await CartProductModel.updateOne(
      { _id, userId },
      { quantity: qty }
    );

    if (updateCartItem.nModified === 0) {
      return response.status(400).json({
        message: "No changes made to cart item",
        error: true,
        success: false,
      });
    }

    return response.json({
      message: "Cart quantity updated successfully",
      success: true,
      error: false,
      data: updateCartItem,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || "Server error updating cart quantity",
      error: true,
      success: false,
    });
  }
};

export const deleteCartItemQtyController = async (request, response) => {
  try {
    const userId = request.userId;
    const { _id } = request.body;

    if (!_id) {
      return response.status(400).json({
        message: "Provide _id",
        error: true,
        success: false,
      });
    }

    const cartItem = await CartProductModel.findOne({ _id, userId });
    if (!cartItem) {
      return response.status(404).json({
        message: "Cart item not found",
        error: true,
        success: false,
      });
    }

    const deleteCartItem = await CartProductModel.deleteOne({ _id, userId });

    if (deleteCartItem.deletedCount === 0) {
      return response.status(400).json({
        message: "No cart item deleted",
        error: true,
        success: false,
      });
    }

    // Remove cartItem ID from user's shopping_cart
    await UserModel.updateOne(
      { _id: userId },
      { $pull: { shopping_cart: _id } }
    );

    return response.json({
      message: "Medicine removed from cart successfully",
      error: false,
      success: true,
      data: deleteCartItem,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || "Server error deleting cart item",
      error: true,
      success: false,
    });
  }
};
