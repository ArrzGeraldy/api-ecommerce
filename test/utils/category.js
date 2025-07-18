import { prismaClient } from "../../src/app/database.js";
import { randomUUID } from "crypto";

export const createTestParentCategory = async () => {
  const category = await prismaClient.category.create({
    data: {
      name: `test parent category ${randomUUID()}`,
      slug: `test-parent-category-${randomUUID()}`,
      parent_id: null,
    },
    select: {
      id: true,
    },
  });

  return category.id;
};

export const createTestChildrenCategory = async (parentId) => {
  const category = await prismaClient.category.create({
    data: {
      name: `test children category ${randomUUID()}`,
      slug: `test-children-category-${randomUUID()}`,
      parent_id: parentId,
    },
    select: {
      id: true,
    },
  });

  return category.id;
};

export const deleteTestCategory = async (id) => {
  await prismaClient.category.delete({
    where: { id },
  });
};

export const getTestCategoryById = async (id) => {
  return await prismaClient.category.findUnique({
    where: { id },
  });
};
