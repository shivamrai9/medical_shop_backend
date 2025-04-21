import { Router } from 'express'
import auth from '../middleware/auth.js'
import {
  createProduct,
  deleteProductDetails,
  getProductByCategory,
  getProductController,
  getProductDetails,
  getProductsBySubCategory,
  searchProduct,
  updateProductDetails,
} from "../controllers/product.controller.js";
import { admin } from '../middleware/Admin.js'
import upload from '../middleware/multer.js';

const productRouter = Router()

productRouter.post("/create", upload.array("images"), createProduct);
productRouter.post('/get',getProductController) 
productRouter.post("/get-product-by-category",getProductByCategory)
productRouter.post("/get-pruduct-by-subcategory", getProductsBySubCategory);
productRouter.post('/get-product-details',getProductDetails)

//update product
productRouter.put('/update-product-details',updateProductDetails)

//delete product
productRouter.delete('/delete-product',auth,admin,deleteProductDetails)

//search product 
productRouter.post('/search-product',searchProduct)

export default productRouter