import { prismaClient } from "../app/database.js";
import { ResponseError } from "../error/response-error.js";
import { validate } from "../validation/validate.js";
import {
  cartItemInsertValidation,
  cartItemUpdateValidation,
} from "../validation/cart-items-validation.js";
import { authorizeUserOrAdmin } from "../utils/authorizatioin-util.js";

const findByUser = async (userId, reqUser) => {
  // Authorization: Only the user who owns the cart or an admin can access this data.
  authorizeUserOrAdmin(userId, reqUser);

  const cartItems = await prismaClient.cartItem.findMany({
    where: {
      user_id: userId,
    },
    include: {
      product_variant: {
        include: {
          product: true,
        },
      },
    },
  });

  const cartWithAmount = cartItems.map((item) => {
    const discount = item.product_variant.product.discount
      ? 1 - item.product_variant.product.discount / 100
      : 1;

    const basePrice = item.product_variant.product.price || 0;
    const priceDiff = item.product_variant.price_diff || 0;
    const amount = (basePrice + priceDiff) * discount * item.quantity;

    return { ...item, amount };
  });

  return cartWithAmount;
};

const insert = async (userId, reqBody, reqUser) => {
  // Authorization: Only the user who owns the cart or an admin can access this data.
  authorizeUserOrAdmin(userId, reqUser);

  const cartItemReq = validate(cartItemInsertValidation, reqBody);
  cartItemReq.user_id = userId;

  // check if user already have product in cart
  const cartItem = await prismaClient.cartItem.findFirst({
    where: {
      user_id: userId,
      product_variant_id: cartItemReq.product_variant_id,
    },
    include: { product_variant: true },
  });

  // if exists
  // run update
  if (cartItem) return runUpdate(cartItem, cartItemReq, userId);

  await validateVariantStock(
    cartItemReq.product_variant_id,
    cartItemReq.quantity
  );

  return await prismaClient.cartItem.create({
    data: cartItemReq,
  });
};

const patchCartItem = async (cartId, userId, reqBody, reqUser) => {
  authorizeUserOrAdmin(userId, reqUser);

  const cartItem = await prismaClient.cartItem.findFirst({
    where: { id: cartId, user_id: userId },
    include: {
      product_variant: true,
    },
  });

  if (!cartItem) throw new ResponseError(404, "Cart item not found");

  const cartItemUpdate = validate(cartItemUpdateValidation, reqBody);
  cartItemUpdate.product_variant_id = cartItem.product_variant_id;

  await validateVariantStock(
    cartItem.product_variant_id,
    cartItemUpdate.quantity
  );

  return await prismaClient.cartItem.update({
    where: { id: cartId, user_id: userId },
    data: cartItemUpdate,
  });
};

const destroy = async (cartId, userId, reqUser) => {
  authorizeUserOrAdmin(userId, reqUser);

  const count = await prismaClient.cartItem.count({ where: { id: cartId } });
  if (count < 1) throw new ResponseError(404, "Cart item not found");

  await prismaClient.cartItem.delete({
    where: { id: cartId },
  });
};

async function validateVariantStock(variantId, reqQuantity) {
  // Find the product variant
  const variant = await prismaClient.productVariant.findUnique({
    where: {
      id: variantId,
      deleted_at: null,
      is_active: true,
    },
    include: { product: true },
  });

  // If the variant not found
  if (!variant) throw new ResponseError(404, "Product variant not found");

  // Check if quantity < variant stock
  if (variant.stock < reqQuantity)
    throw new ResponseError(400, "Requested quantity exceeds available stock");
}

async function runUpdate(cartItem, cartItemUpdate, userId) {
  const totalQty = cartItem.quantity + cartItemUpdate.quantity;
  if (totalQty > cartItem.product_variant.stock)
    throw new ResponseError(
      400,
      `You already have ${cartItem.quantity} in cart. Adding ${cartItemUpdate.quantity} exceeds stock limit.`
    );

  // recalculate amount
  cartItemUpdate.amount = await validateVariantStock(
    cartItemUpdate.product_variant_id,
    totalQty
  );
  return await prismaClient.cartItem.update({
    where: {
      id: cartItem.id,
      user_id: userId,
      product_variant_id: cartItemUpdate.product_variant_id,
    },
    data: {
      quantity: totalQty,
      amount: cartItemUpdate.amount,
    },
  });
}

export default {
  findByUser,
  insert,
  patchCartItem,
  destroy,
};
