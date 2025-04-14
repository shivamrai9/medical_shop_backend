import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    address_line: {
      type: String,
      required: [true, "Provide address"],
    },
    city: {
      type: String,
      required: [true, "Provide city"],
    },
    state: {
      type: String,
      required: [true, "Provide state"],
    },
    pincode: {
      type: String,
      required: [true, "Provide pincode"],
    },
    country: {
      type: String,
      required: [true, "Provide country"],
    },
    mobile: {
      type: Number,
      required: [true, "Provide mobile number"],
    },
    status: {
      type: Boolean,
      default: true,
    },
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    delivery_instructions: {
      // New field for medical delivery
      type: String,
      default: "Leave at doorstep if not available",
    },
  },
  {
    timestamps: true,
  }
);

const AddressModel = mongoose.model("address", addressSchema);
export default AddressModel;
