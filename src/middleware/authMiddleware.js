import jwt from "jsonwebtoken";
import { config } from "../app/config.js";

export const authMiddleware = (req, res, next) => {
  const accessToken = req.headers.authorization?.split(" ")[1];
  if (!accessToken) return res.status(401).json({ errors: "Unauthorized" });

  try {
    const decoded = jwt.verify(accessToken, config.accessTokenSecret);
    req.user = decoded;
    next();
  } catch (error) {
    console.log({ error });
    return res.status(401).json({ errors: "Unauthorized" });
  }
};

export const attachUser = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.accessTokenSecret);
    req.user = decoded;
  } catch (err) {
    console.warn("Invalid token:", err.message);
    req.user = undefined;
  }

  next();
};
