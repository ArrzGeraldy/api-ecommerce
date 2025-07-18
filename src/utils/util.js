import { ResponseError } from "../error/response-error.js";

export const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Ganti spasi dengan -
    .replace(/[^\w\-]+/g, "") // Hapus karakter non-word
    .replace(/\-\-+/g, "-"); // Ganti -- dengan -
};

export const parseIntOrThrow = (numStr, msg) => {
  const num = Number(numStr);
  if (isNaN(num)) throw new ResponseError(400, msg);
  return num;
};

export const calculateProductAmount = (
  productDiscount,
  productPrice,
  variantPriceDiff,
  qty
) => {
  const discount = productDiscount ? 1 - productDiscount / 100 : 1;
  const basePrice = productPrice || 0;
  const priceDiff = variantPriceDiff || 0;

  return (basePrice + priceDiff) * discount * qty;
};

export const randomString = (length = 8) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    const randIndex = Math.floor(Math.random() * chars.length);
    result += chars[randIndex];
  }

  return result;
};
