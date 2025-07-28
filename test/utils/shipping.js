import { prismaClient } from "../../src/app/database";

export const createTestShipping = async (orderId) => {
  await prismaClient.shipping.create({
    data: {
      city: "city",
      phone: "0888889999",
      postal_code: "4312",
      province: "province",
      recipient_name: "test-name",
      shipping_cost: 10000,
      shipping_courier: "JNE",
      order_id: orderId,
    },
  });
};

export const deleteTestShippingByOrderId = async (orderId) => {
  await prismaClient.shipping.delete({ where: { order_id: orderId } });
};
