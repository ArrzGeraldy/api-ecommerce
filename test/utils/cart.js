import { prismaClient } from "../../src/app/database.js";

export const createTestCartItem = async (
  user_id,
  product_variant_id,
  qty = 2
) => {
  const cartItem = await prismaClient.cartItem.create({
    data: {
      user_id,
      product_variant_id,
      quantity: qty,
    },
  });
  return cartItem.id;
};

export const deleteTestCartItem = async (id) => {
  await prismaClient.cartItem.delete({
    where: { id },
  });
};

export const countCartItemByProductTest = async (productId) => {
  return await prismaClient.cartItem.count({
    where: {
      product_variant: {
        product_id: productId,
      },
    },
  });
};
export const countCartItemById = async (id) => {
  return await prismaClient.cartItem.count({
    where: {
      id,
    },
  });
};
