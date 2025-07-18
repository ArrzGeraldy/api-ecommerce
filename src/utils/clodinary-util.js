import { createReadStream } from "streamifier";
import cloudinary from "../config/cloudinary.js";
import { config } from "../app/config.js";

export const uploadStreamClodinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: config.cloudinaryFolder,
        transformation: [{ quality: "auto" }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    createReadStream(buffer).pipe(stream);
  });
};

export const deleteFromCloudinary = async (publicId) => {
  await cloudinary.uploader.destroy(publicId);
};

export const getPublicIdCloudinary = (url) => {
  const parts = url.split("/");
  const fileWithExt = parts.pop();
  const folder = parts.pop();

  const fileName = fileWithExt.split(".")[0];
  return `${folder}/${fileName}`;
};

export const processUpdateImage = async (file, url) => {
  const publicId = getPublicIdCloudinary(url);
  await deleteFromCloudinary(publicId);

  const result = await uploadStreamClodinary(file.buffer);
  return result?.secure_url;
};
