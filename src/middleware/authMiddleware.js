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
