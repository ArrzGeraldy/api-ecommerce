import { prismaClient } from "../app/database.js";
import { ResponseError } from "../error/response-error.js";
import { generateSlug } from "../utils/util.js";
import { categoryValidation } from "../validation/category-validation.js";
import { validate } from "../validation/validate.js";

const findAll = async (filter) => {
  const whereClause = {
    deleted_at: null,
  };

  const selectClause = {
    id: true,
    name: true,
    parent_id: true,
    created_at: true,
    slug: true,
    parent: {
      select: {
        id: true,
        name: true,
      },
    },
  };

  // Search by name
  if (filter.search) {
    whereClause.name = {
      contains: filter.search,
      mode: "insensitive",
    };
  }

  // Filter by type
  switch (filter.type) {
    case "parent":
      whereClause.parent_id = null;
      break;

    case "children":
      whereClause.parent_id = { not: null };
      break;

    case "tree":
      whereClause.parent_id = null;
      selectClause.children = {
        select: {
          id: true,
          name: true,
        },
      };
      delete selectClause.parent;
      break;

    case "children-by-slug":
      if (!filter.slug) {
        throw new Error("Missing 'slug' for childrenBySlug filter");
      }

      // Cari parent category berdasarkan slug
      const parent = await prismaClient.category.findFirst({
        where: {
          slug: filter.slug,
          deleted_at: null,
        },
        select: {
          id: true,
        },
      });

      if (!parent) {
        return { data: [], total_page: 0, total_data: 0 };
      }

      // Ganti whereClause untuk ambil children-nya
      whereClause.parent_id = parent.id;
      break;

    default:
      break;
  }

  const skip = (filter.page - 1) * filter.limit;
  const take = filter.limit;

  const [total, data] = await Promise.all([
    prismaClient.category.count({ where: whereClause }),
    prismaClient.category.findMany({
      where: whereClause,
      select: selectClause,
      take,
      skip,
      orderBy: {
        created_at: "asc",
      },
    }),
  ]);

  return {
    data,
    total_page: Math.ceil(total / take),
    total_data: total,
  };
};

const findById = async (id) => {
  const category = await prismaClient.category.findUnique({
    where: { id },
  });

  if (!category) throw new ResponseError(404, "Category not found");

  return category;
};

const create = async (req) => {
  const category = validate(categoryValidation, req);

  let parent = null;

  if (category.parent_id) {
    parent = await prismaClient.category.findUnique({
      where: {
        id: category.parent_id,
        parent_id: null,
      },
    });

    if (!parent || parent.parent_id !== null)
      throw new ResponseError(400, "Invalid Parent");
    const children = await prismaClient.category.count({
      where: { name: category.name, parent_id: category.parent_id },
    });

    if (children > 0)
      throw new ResponseError(400, "Duplicate child name under this parent");
  } else {
    const duplicateParent = await prismaClient.category.findFirst({
      where: {
        name: {
          equals: category.name,
          mode: "insensitive",
        },
        parent_id: null,
      },
    });

    if (duplicateParent) {
      throw new ResponseError(400, "Duplicate parent name");
    }
  }

  return await prismaClient.category.create({
    data: {
      name: category.name,
      parent_id: category.parent_id,
      slug: generateSlug(
        category.name + (parent?.name ? ` ${parent.name}` : "")
      ),
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
  create,
  update,
  destroy,
  findAll,
  findById,
};
