import { logger } from "../app/logger.js";
import { ResponseError } from "../error/response-error.js";
import { MulterError } from "multer";
import { UploadError } from "../error/upload-error.js";
// import { MidtransError } from "midtrans-client";

const errorMiddleware = async (err, req, res, next) => {
  if (!err) {
    return next();
  }

  if (err instanceof ResponseError) {
    logger.error(err.message);
    return res.status(err.status).json({ errors: err.message });
  }

  if (err instanceof UploadError) {
    return res.status(err.status).json({ errors: err.message });
  }

  // if(err instanceof MidtransError)

  if (err instanceof MulterError) {
    logger.error("Multer error code: " + err.code);
    logger.error("Multer error: " + err.message);
    return res.status(500).json({ errors: err.messag });
  }

  logger.error(err.message);
  return res.status(500).json({ errors: "Internal server error" });
};

export { errorMiddleware };
