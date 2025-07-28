import { config } from "../app/config.js";
import crypto from "crypto";
import { ResponseError } from "../error/response-error.js";
import { prismaClient } from "../app/database.js";
import { logger } from "../app/logger.js";

const webhookPayment = async (reqBody) => {
  const {
    order_id,
    status_code,
    gross_amount,
    signature_key,
    transaction_status,
  } = reqBody;

  console.log({ reqBody });

  const rawSignature =
    order_id + status_code + gross_amount + config.midtransServerKey;
  const expectedSignature = crypto
    .createHash("sha512")
    .update(rawSignature)
    .digest("hex");

  if (signature_key !== expectedSignature)
    throw new ResponseError(400, "Invalid signature key");

  const order = await prismaClient.order.findUnique({
    where: { id: order_id },
  });

  if (!order) throw new ResponseError(404, "Order not found");

  logger.info("Webhook from Midtrans:");
  logger.info("Order:", order_id, "Status:", transaction_status);

  // mapping status
  const statusMap = {
    settlement: { order: "progress", payment: "settlement" },
    expire: { order: "canceled", payment: "expired" },
    cancel: { order: "canceled", payment: "canceled" },
  };

  const status = statusMap[transaction_status];
  if (!status) {
    throw new ResponseError(400, "Unsupported transaction status");
  }

  await prismaClient.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: status.order,
      },
    });

    await tx.payment.update({
      where: { order_id: order.id },
      data: {
        status: status.payment,
      },
    });
  });
};

export default {
  webhookPayment,
};
