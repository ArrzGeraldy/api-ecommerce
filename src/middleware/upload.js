import multer, { MulterError } from "multer";
import { UploadError } from "../error/upload-error.js";

const storage = multer.memoryStorage();
const upload = multer({ storage });

export const uploadMiddleware = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) return next(new UploadError(400, err.message));

    const file = req.files?.[0];

    if (!file) {
      return next(new UploadError(400, "Image file is required"));
    }

    if (file.fieldname !== "image") {
      return next(new UploadError(400, "Form field must be named 'image'"));
    }

    if (file.size > 2 * 1024 * 1024) {
      return next(new UploadError(400, "Image must be less than 2MB"));
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.mimetype)) {
      return next(new UploadError(400, "Unsupported file type"));
    }

    req.file = file;

    next();
  });
};

export const uploadUpdateMiddleware = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) return next(new UploadError(400, err.message));

    const file = req.files?.[0];

    if (!file) {
      req.file = undefined;
      return next();
    }

    if (file.fieldname !== "image") {
      return next(new UploadError(400, "Form field must be named 'image'"));
    }

    if (file.size > 2 * 1024 * 1024) {
      return next(new UploadError(400, "Image must be less than 2MB"));
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.mimetype)) {
      return next(new UploadError(400, "Unsupported file type"));
    }

    req.file = file;

    next();
  });
};
