import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

import categoryController from "../controller/category-controller.js";
import productController from "../controller/product-controller.js";
import addressController from "../controller/address-controller.js";
import orderController from "../controller/order-controller.js";

import {
  uploadMiddleware,
  uploadUpdateMiddleware,
} from "../middleware/upload.js";
import cartItemController from "../controller/cart-item-controller.js";
import userController from "../controller/user-controller.js";
import variantController from "../controller/variant-controller.js";

const protectedRouter = express.Router();

protectedRouter.use(authMiddleware);

// user api
protectedRouter.get("/users", requireAdmin, userController.getAll);
protectedRouter.get("/users/:id", userController.getById);
protectedRouter.patch("/users/:id", userController.edit);
protectedRouter.delete("/users/:id", requireAdmin, userController.destroy);

// category api
protectedRouter.post("/categories", requireAdmin, categoryController.create);
protectedRouter.put("/categories/:id", requireAdmin, categoryController.update);
protectedRouter.delete(
  "/categories/:id",
  requireAdmin,
  categoryController.destroy
);

// product api
protectedRouter.post(
  "/products",
  requireAdmin,
  uploadMiddleware,
  productController.create
);
protectedRouter.patch(
  "/products/:id",
  requireAdmin,
  uploadUpdateMiddleware,
  productController.edit
);
protectedRouter.delete(
  "/products/:id",
  requireAdmin,
  productController.destroy
);

// variants
protectedRouter.delete(
  "/variants/:id",
  requireAdmin,
  variantController.destroy
);

// user address
protectedRouter.get("/users/:userId/address", addressController.getByUser);
protectedRouter.post("/users/:userId/address", addressController.create);
protectedRouter.patch("/users/:userId/address/:id", addressController.edit);
protectedRouter.delete("/users/:userId/address/:id", addressController.destroy);

// user cart item api
protectedRouter.get("/users/:userId/cart", cartItemController.getByUser);
protectedRouter.post("/users/:userId/cart", cartItemController.create);
protectedRouter.patch("/users/:userId/cart/:id", cartItemController.edit);
protectedRouter.delete("/users/:userId/cart/:id", cartItemController.destroy);

// order api
protectedRouter.get("/orders", requireAdmin, orderController.getAll);
protectedRouter.get("/orders/:id", orderController.getById);
protectedRouter.get("/users/:userId/orders", orderController.getByUser);
protectedRouter.post("/orders", orderController.createOrder);
protectedRouter.post("/orders/:id/payment", orderController.createPayment);
protectedRouter.patch("/orders/:id", requireAdmin, orderController.edit);

export { protectedRouter };
