import { Router } from 'express'
import auth from '../middleware/auth.js'
import { CashOnDeliveryOrderController, deleteOrder, getAllOrders, getOrderDetails, getOrderDetailsController, paymentController, updateOrderStatus, webhookStripe } from '../controllers/order.controller.js'
import { admin } from '../middleware/Admin.js'

const orderRouter = Router()

orderRouter.post("/cash-on-delivery",auth,CashOnDeliveryOrderController)
orderRouter.post('/checkout',auth,paymentController)
orderRouter.post('/webhook',webhookStripe)
orderRouter.get("/order-list",auth,getOrderDetailsController)


orderRouter.get("/Allorders",auth, admin, getAllOrders);
orderRouter.get("/:orderId",auth, admin, getOrderDetails);
orderRouter.patch("/:orderId",auth, admin, updateOrderStatus);
orderRouter.delete("/:orderId",auth, admin, deleteOrder);

export default orderRouter