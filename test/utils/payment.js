import { prismaClient } from "../../src/app/database";

export const createTestPayment = async (orderId, overrides = {}) => {
  const payment = await prismaClient.payment.create({
    data: {
      order_id: orderId,
      bank: overrides.bank || "bca",
      method: overrides.method || "transfer",
      status: overrides.status || "pending",
      va_number: overrides.vaNumber || "123456789",
    },
    select: {
      id: true,
    },
  });

  return payment.id;
};
