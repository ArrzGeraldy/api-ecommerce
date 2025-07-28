import { prismaClient } from "../../src/app/database.js";

export const createTestOrder = async (user_id, overrides = {}) => {
  const order = await prismaClient.order.create({
    data: {
      base_price: overrides.base_price || 100000,
      final_price: overrides.final_price || 20000,
      user_id,
    },
  });

  return order.id;
};

export const deleteTestOrder = async (id) => {
  await prismaClient.order.delete({ where: { id } });
};

export const createTestOrderItem = async (
  orderId,
  variantId,
  overrides = {}
) => {
  const orderItem = await prismaClient.orderItem.create({
    data: {
      order_id: orderId,
      quantity: overrides.quantity || 10,
      product_variant_id: variantId,
      amount: overrides.amount || 10000,
    },
  });

  return orderItem.id;
};

export const deleteTestOrderItem = async (id) => {
  await prismaClient.orderItem.delete({ where: { id } });
};

export const countTotalOrder = async () => {
  return await prismaClient.order.count();
};
