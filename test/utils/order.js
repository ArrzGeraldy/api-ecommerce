import { prismaClient } from "../../src/app/database.js";
import { randomUUID } from "crypto";

export const createTestOrder = async (user_id, address_id) => {
  const order = await prismaClient.order.create({
    data: {
      user_id,
      address_id,
      shipping_courier: "JNE",
      shipping_cost: 10000,
      tracking_number: "TRK123456789",
      final_price: 300000,
      base_price: 200000,
      status: "pending",
    },
  });
  return order.id;
};

export const deleteTestOrder = async (id) => {
  await prismaClient.order.delete({
    where: { id },
  });
};

export const createTestOrderItem = async (order_id, product_variant_id) => {
  const orderItem = await prismaClient.orderItem.create({
    data: {
      order_id,
      product_variant_id,
      quantity: 1,
      amount: 10000,
    },
  });
  return orderItem.id;
};

export const deleteTestOrderItem = async (id) => {
  await prismaClient.orderItem.delete({
    where: { id },
  });
};

export const countTotalOrder = async (whereClause = {}) => {
  return await prismaClient.order.count({
    where: whereClause,
  });
};
