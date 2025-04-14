import express from "express";
import {
  uploadPrescriptionController,
  verifyPrescriptionController,
} from "../controllers/prescription.controller.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Upload prescription by user
router.post("/upload", auth, uploadPrescriptionController);

// Verify prescription for cart items by admin
router.put("/verify/:userId", auth, verifyPrescriptionController);

export default router;
