import { prismaClient } from "../app/database.js";
import { ResponseError } from "../error/response-error.js";
import { generateSlug } from "../utils/util.js";
import { categoryValidation } from "../validation/category-validation.js";
import { validate } from "../validation/validate.js";

const getCategoryTree = async () => {
  const parents = await prismaClient.category.findMany({
    where: {
      parent_id: null,
    },
    select: {
      id: true,
      name: true,
      children: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return parents;
};

const create = async (req) => {
  const category = validate(categoryValidation, req);

  if (category.parent_id) {
    const parent = await prismaClient.category.count({
      where: {
        id: category.parent_id,
        parent_id: null,
      },
    });

    if (!parent) throw new ResponseError(400, "Invalid Parent");
  }

  return await prismaClient.category.create({
    data: {
      name: category.name,
      parent_id: category.parent_id,
      slug: generateSlug(category.name),
    },
    select: {
      id: true,
      name: true,
      parent_id: true,
    },
  });
};

const update = async (id, req) => {
  const categoryReq = validate(categoryValidation, req);

  const count = await prismaClient.category.count({
    where: {
      id: id,
    },
  });

  if (!count) throw new ResponseError(404, "Category not found");

  return await prismaClient.category.update({
    where: {
      id: id,
    },
    data: {
      name: categoryReq.name,
      parent_id: categoryReq.parent_id,
      slug: generateSlug(categoryReq.name),
    },
    select: {
      id: true,
      name: true,
      parent_id: true,
    },
  });
};

const destroy = async (id) => {
  const category = await prismaClient.category.findUnique({
    where: {
      id: id,
    },
  });

  if (!category) throw new ResponseError(404, "Category not found");

  // check is parent
  if (category.parent_id === null) {
    // check have children
    const countChildren = await prismaClient.category.count({
      where: { parent_id: category.id, deleted_at: null },
    });

    if (countChildren > 0)
      throw new ResponseError(
        400,
        "Cannot delete category that has active children"
      );
  }

  // check children relation to product
  const products = await prismaClient.product.findMany({
    where: {
      category_id: category.id,
      deleted_at: null,
    },
  });

  if (products.length > 0) {
    return await runSoftDeleteCategory(products, category);
  }
  await prismaClient.category.delete({
    where: {
      id: id,
    },
  });

  return null;
};

async function runSoftDeleteCategory(products, category) {
  let deletedAt;
  await prismaClient.$transaction(async (tx) => {
    for (const product of products) {
      // run soft delete products
      await tx.product.update({
        where: { id: product.id },
        data: {
          deleted_at: new Date(),
          is_active: false,
        },
      });

      // run soft delete variants
      await tx.productVariant.updateMany({
        where: { product_id: product.id, deleted_at: null },
        data: {
          deleted_at: new Date(),
          is_active: false,
        },
      });
    }

    // run soft delete category
    deletedAt = await tx.category.update({
      where: { id: category.id },
      data: {
        deleted_at: new Date(),
        is_active: false,
      },
      select: {
        deleted_at: true,
      },
    });
  });

  return deletedAt;
}

export default {
  getCategoryTree,
  create,
  update,
  destroy,
};
