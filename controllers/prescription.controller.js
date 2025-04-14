import PrescriptionModel from "../models/prescription.model.js";

export const uploadPrescriptionController = async (req, res) => {
  try {
    const { prescriptionUrl } = req.body;
    const userId = req.user.id;

    const newPrescription = new PrescriptionModel({
      user: userId,
      url: prescriptionUrl,
      verified: false,
    });

    await newPrescription.save();

    res
      .status(200)
      .json({ message: "Prescription uploaded", data: newPrescription });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error uploading prescription", error: error.message });
  }
};
