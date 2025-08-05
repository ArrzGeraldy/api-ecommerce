import { prismaClient } from "../../src/app/database.js";

export const createTestProductVariant = async (productId, overrides = {}) => {
  const variant = await prismaClient.productVariant.create({
    data: {
      product_id: productId,
      name: overrides.name || "Variant S",
      stock: overrides.stock || 10,
      price_diff: overrides.price_diff || 0,
      is_active: overrides.is_active ?? true,
    },
  });

  return variant.id;
};

export const deleteTestVariant = async (id) => {
  await prismaClient.productVariant.deleteMany({
    where: {
      id,
    },
  });
};

export const countVariantByProductIdTest = async (productId) => {
  return await prismaClient.productVariant.count({
    where: {
      product_id: productId,
    },
  });
};
