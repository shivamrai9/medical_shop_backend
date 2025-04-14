import { Router } from 'express'
import auth from '../middleware/auth.js'
import {
  createProduct,
  deleteProductDetails,
  getProductByCategory,
  getProductByCategoryAndSubCategory,
  getProductController,
  getProductDetails,
  searchProduct,
  updateProductDetails,
} from "../controllers/product.controller.js";
import { admin } from '../middleware/Admin.js'
import upload from '../middleware/multer.js';

const productRouter = Router()

productRouter.post("/create", upload.array("images"), createProduct);
productRouter.post('/get',getProductController)
productRouter.post("/get-product-by-category",getProductByCategory)
productRouter.post('/get-pruduct-by-category-and-subcategory',getProductByCategoryAndSubCategory)
productRouter.post('/get-product-details',getProductDetails)

//update product
productRouter.put('/update-product-details',updateProductDetails)

//delete product
productRouter.delete('/delete-product',deleteProductDetails)

//search product 
productRouter.post('/search-product',searchProduct)

export default productRouter