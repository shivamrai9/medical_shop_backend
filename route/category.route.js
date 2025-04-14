import express from "express";
import {
  createCategory,
  getAllCategories,
  getParentCategories,
  getChildCategories,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";

const router = express.Router();

router.post("/add-category", createCategory);
router.get("/", getAllCategories);
router.get("/parents", getParentCategories);
router.get("/children/:id", getChildCategories);
router.put("/update/:id", updateCategory);
router.delete("/delete/:id", deleteCategory);

export default router;
