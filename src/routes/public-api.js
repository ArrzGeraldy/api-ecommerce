import express from "express";
import authController from "../controller/auth-controller.js";
import categoryController from "../controller/category-controller.js";
import productController from "../controller/product-controller.js";
import { attachUser } from "../middleware/authMiddleware.js";
const publicRouter = express.Router();

// auth api
publicRouter.post("/auth/register", authController.register);
publicRouter.post("/auth/login", authController.login);
publicRouter.delete("/auth/logout", authController.logout);
publicRouter.post("/auth/refresh", authController.refresh);

// category api
publicRouter.get("/categories", categoryController.findAll);

// product api
publicRouter.get("/products", attachUser, productController.getAll);
publicRouter.get("/products/:id", attachUser, productController.findById);

export { publicRouter };
