import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    image: {
      // Prescription image uploaded by user
      type: String,
      default: "",
    },
    status: {
      // Verified by pharmacist
      type: String,
      enum: ["Pending", "Verified", "Rejected"],
      default: "Pending",
    },
    notes: {
      // Pharmacist notes (e.g., rejection reason)
      type: String,
      default: "",
    },
    verified_by: {
      type: mongoose.Schema.ObjectId,
      ref: "User", // Pharmacist who verified it
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const PrescriptionModel = mongoose.model("prescription", prescriptionSchema);
export default PrescriptionModel;
