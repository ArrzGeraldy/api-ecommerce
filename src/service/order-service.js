import { ResponseError } from "../error/response-error.js";
import { midtransCoreApi } from "../config/midtrans.js";
import { prismaClient } from "../app/database.js";
import { validate } from "../validation/validate.js";
import {
  orderCreateValidationBank,
  orderPatchValidation,
} from "../validation/order-validation.js";
import { calculateProductAmount, randomString } from "../utils/util.js";
import { authorizeUserOrAdmin } from "../utils/authorizatioin-util.js";

const findAll = async (filter) => {
  const whereClause = {};

  if (filter.status) {
    // throw error if not valid
    validateStatus(filter.status);
    whereClause.status = filter.status;
  }

  const skip = (filter.page - 1) * filter.limit;

  const [total, data] = await Promise.all([
    prismaClient.order.count({ where: whereClause }),
    prismaClient.order.findMany({
      where: whereClause,
      include: {
        order_items: true,
        payment: true,
      },
      take: filter.limit,
      skip: skip,
      orderBy: { created_at: "desc" },
    }),
  ]);

  const totalPage = Math.ceil(total / filter.limit);

  return {
    data,
    total_page: totalPage,
    total_data: total,
  };
};

const findByUser = async (userId, reqUser, filter) => {
  authorizeUserOrAdmin(userId, reqUser);

  const whereClause = {};

  if (filter.status) {
    // throw error if not valid
    validateStatus(filter.status);
    whereClause.status = filter.status;
  }

  whereClause.user_id = userId;

  const skip = (filter.page - 1) * filter.limit;

  const [total, data] = await Promise.all([
    prismaClient.order.count({ where: whereClause }),
    prismaClient.order.findMany({
      where: whereClause,
      include: {
        order_items: {
          include: {
            product_variant: {
              include: {
                product: true,
              },
            },
          },
        },
        payment: true,
      },
      take: filter.limit,
      skip: skip,
      orderBy: { created_at: "desc" },
    }),
  ]);

  const totalPage = Math.ceil(total / filter.limit);

  return {
    data,
    total_page: totalPage,
    total_data: total,
  };
};

const findById = async (id, reqUser) => {
  const order = await getOrderById(id);
  if (!order) throw new ResponseError(404, "Order not found");

  authorizeUserOrAdmin(order.user_id, reqUser);

  return order;
};

const createBankTransferOrder = async (userId, reqBody) => {
  // validate req
  // ✅ include validation bank value (bca,bri,bni,cimb)
  const orderReq = validate(orderCreateValidationBank, reqBody);

  // validate stock & calculate base price
  // also add amount to req item
  let basePrice = 0;
  for (const reqItem of orderReq.items) {
    const variant = await prismaClient.productVariant.findUnique({
      where: { id: reqItem.product_variant_id },
      select: {
        stock: true,
        name: true,
        price_diff: true,
        product: {
          select: {
            id: true,
            name: true,
            discount: true,
            price: true,
          },
        },
      },
    });

    if (!variant) throw new ResponseError(404, "Product variant not found");

    // Check if requested quantity exceeds stock
    if (reqItem.quantity > variant.stock) {
      throw new ResponseError(
        400,
        `Only ${variant.stock} left for variant "${variant.name}"`
      );
    }

    // Calculate final amount based on discount, base price, and price difference
    const amount = calculateProductAmount(
      variant.product.discount,
      variant.product.price,
      variant.price_diff,
      reqItem.quantity
    );

    reqItem.amount = amount; // Add amount to item
    basePrice += amount; // Add to total base pric
  }

  // validate address is owner by userid
  const countAddress = await prismaClient.address.count({
    where: { id: orderReq.address_id, user_id: userId },
  });

  if (countAddress < 1) throw new ResponseError(403, "is not your address");

  // CREATE FAKE SHIPPING
  const fakeShippingCost = 10000;
  const fakeTrackingNum = randomString(8);

  // create order
  const newOrder = await prismaClient.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        user_id: userId,
        address_id: orderReq.address_id,
        shipping_courier: orderReq.shipping_courier,
        shipping_cost: fakeShippingCost,
        tracking_number: fakeTrackingNum,
        base_price: basePrice,
        final_price: basePrice + fakeShippingCost,
      },
    });

    await tx.orderItem.createMany({
      data: orderReq.items.map((item) => ({
        order_id: order.id, // relasi manual
        product_variant_id: item.product_variant_id,
        quantity: item.quantity,
        amount: item.amount,
      })),
    });

    await tx.payment.create({
      data: {
        order_id: order.id,
        method: "bank_transfer",
        bank: orderReq.bank,
      },
    });

    return order;
  });

  // charge midtrans
  const parameter = {
    payment_type: "bank_transfer",
    transaction_details: {
      order_id: newOrder.id,
      gross_amount: newOrder.final_price,
    },
    bank_transfer: {
      bank: orderReq.bank,
    },
  };

  try {
    const chargeRes = await midtransCoreApi.charge(parameter);

    if (
      chargeRes.status_code !== "201" ||
      chargeRes.fraud_status !== "accept"
    ) {
      throw new Error("Midtrans rejected the charge request");
    }

    const vaNumber =
      Array.isArray(chargeRes.va_numbers) && chargeRes.va_numbers.length > 0
        ? chargeRes.va_numbers[0].va_number
        : null;

    if (!vaNumber || !chargeRes.expiry_time) {
      throw new Error("Missing VA number or expiry time from Midtrans");
    }

    await prismaClient.payment.update({
      where: { order_id: newOrder.id },
      data: {
        expiry_time: new Date(chargeRes.expiry_time),
        va_number: vaNumber,
      },
    });

    return getOrderById(newOrder.id);
  } catch (error) {
    console.error("Midtrans charge error:", error);
    throw new ResponseError(
      502,
      "Payment processing failed. Please try again."
    );
  }
};

const patchOrder = async (id, reqBody) => {
  const order = await getOrderById(id);
  if (!order) throw new ResponseError(404, "Order not found");

  const patchReq = validate(orderPatchValidation, reqBody);

  if (Object.keys(patchReq).length === 0) {
    throw new ResponseError(400, "No valid fields to update");
  }

  if (patchReq.payment_status) {
    patchReq.payment = {
      update: {
        status: patchReq.payment_status,
      },
    };

    delete patchReq.payment_status;
  }

  return await prismaClient.order.update({
    where: { id },
    data: patchReq,
    include: {
      payment: true,
    },
  });
};

async function getOrderById(id) {
  return await prismaClient.order.findUnique({
    where: { id },
    include: {
      order_items: true,
      payment: true,
    },
  });
}

function validateStatus(status) {
  const allowedStts = [
    "pending",
    "progress",
    "shipping",
    "completed",
    "canceled",
  ];

  if (!allowedStts.includes(status))
    throw new ResponseError(400, "Invalid value status");
}

export default {
  createBankTransferOrder,
  findById,
  findAll,
  findByUser,
  patchOrder,
};
