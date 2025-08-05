import { prismaClient } from "../../src/app/database";

export const createTestProduct = async (categoryId, overrides = {}) => {
  const product = await prismaClient.product.create({
    data: {
      name: overrides.name || "test product xyz",
      category_id: categoryId,
      cost_price: overrides.price || 9000,
      price: overrides.price || 10000,
      discount: overrides.discount || null,
      img_url: "https://example.com/image.jpg",
      description: "Test product will delete soon",
    },
    select: {
      id: true,
    },
  });

  return product.id;
};

export const deleteTestProduct = async (id) => {
  await prismaClient.product.deleteMany({
    where: {
      id,
    },
  });
};

export const getTestProduct = async (id) => {
  return await prismaClient.product.findUnique({
    where: { id },
  });
};

export const getVariantJsonTest = () => {
  const data = [
    { name: "S", price_diff: 0, stock: 8 },
    { name: "M", price_diff: 30000, stock: 4 },
    { name: "L", price_diff: 30000, stock: 4 },
  ];

  return JSON.stringify(data);
};
