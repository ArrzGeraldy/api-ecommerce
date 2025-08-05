import express from "express";
import { errorMiddleware } from "../middleware/error-middleware.js";
import { publicRouter } from "../routes/public-api.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { protectedRouter } from "../routes/protected-api.js";

export const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://frontend-ecommerce-5lwd.vercel.app",
      "https://frontend-ecommerce-navy.vercel.app",
    ],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1", publicRouter);
app.use("/api/v1", protectedRouter);

app.use(errorMiddleware);
