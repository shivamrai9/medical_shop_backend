import AddressModel from "../models/address.model.js";
import UserModel from "../models/user.model.js"; 

export const addAddressController = async (request, response) => {
  try {
    const userId = request.user.id; 
    console.log(userId,"userId")
    const {
      address_line,
      city,
      state,
      pincode,
      country,
      mobile,
      delivery_instructions,
    } = request.body;

    if (!address_line || !city || !state || !pincode || !country || !mobile) {
      return response.status(400).json({
        message:
          "Provide address_line, city, state, pincode, country, and mobile",
        error: true,
        success: false,
      });
    }

    const createAddress = new AddressModel({
      address_line,
      city,
      state,
      pincode,
      country,
      mobile,
      userId,
      delivery_instructions:
        delivery_instructions || "Leave at doorstep if not available",
    });
    const saveAddress = await createAddress.save();

    await UserModel.findByIdAndUpdate(userId, {
      $push: { address_details: saveAddress._id },
    });

    return response.json({
      message: "Delivery address created successfully",
      error: false,
      success: true,
      data: saveAddress,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || "Server error adding address",
      error: true,
      success: false,
    });
  }
};

export const getAddressController = async (request, response) => {
  try {
    const userId = request.user.id;

    const data = await AddressModel.find({ userId, status: true }).sort({
      createdAt: -1,
    });

    return response.json({
      data,
      message: "List of active delivery addresses",
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || "Server error fetching addresses",
      error: true,
      success: false,
    });
  }
};

export const updateAddressController = async (request, response) => {
  try {
    const userId = request.user.id;
    const {
      _id,
      address_line,
      city,
      state,
      country,
      pincode,
      mobile,
      delivery_instructions,
    } = request.body;

    if (!_id) {
      return response.status(400).json({
        message: "Provide address _id",
        error: true,
        success: false,
      });
    }

    if (!address_line || !city || !state || !country || !pincode || !mobile) {
      return response.status(400).json({
        message:
          "Provide address_line, city, state, country, pincode, and mobile",
        error: true,
        success: false,
      });
    }

    const updateAddress = await AddressModel.updateOne(
      { _id, userId },
      {
        address_line,
        city,
        state,
        country,
        pincode,
        mobile,
        delivery_instructions,
      }
    );

    if (updateAddress.modifiedCount === 0) {
      return response.status(404).json({
        message: "Address not found or no changes made",
        error: true,
        success: false,
      });
    }

    return response.json({
      message: "Delivery address updated successfully",
      error: false,
      success: true,
      data: updateAddress,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || "Server error updating address",
      error: true,
      success: false,
    });
  }
};

export const deleteAddresscontroller = async (request, response) => {
  try {
    const userId = request.user.id;
    const { _id } = request.body;

    if (!_id) {
      return response.status(400).json({
        message: "Provide address _id",
        error: true,
        success: false,
      });
    }

    const disableAddress = await AddressModel.updateOne(
      { _id, userId },
      { status: false }
    );

    if (disableAddress.modifiedCount === 0) {
      return response.status(404).json({
        message: "Address not found",
        error: true,
        success: false,
      });
    }

    await UserModel.updateOne(
      { _id: userId },
      { $pull: { address_details: _id } }
    );

    return response.json({
      message: "Delivery address removed successfully",
      error: false,
      success: true,
      data: disableAddress,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || "Server error removing address",
      error: true,
      success: false,
    });
  }
};

