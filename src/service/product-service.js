import { prismaClient } from "../app/database.js";
import { logger } from "../app/logger.js";
import { ResponseError } from "../error/response-error.js";
import { UploadError } from "../error/upload-error.js";
import {
  deleteFromCloudinary,
  getPublicIdCloudinary,
  processUpdateImage,
  uploadStreamClodinary,
} from "../utils/clodinary-util.js";

import {
  productInsertValidation,
  productPatchValidation,
} from "../validation/product-validation.js";
import { validate } from "../validation/validate.js";

const getAll = async (filter, reqUser) => {
  let whereClause = {};

  if (filter.search) {
    whereClause.name = {
      contains: filter.search,
      mode: "insensitive",
    };
  }

  if (filter.parent) {
    whereClause.category = {
      ...whereClause.category,
      parent: {
        slug: filter.parent,
      },
    };
  }

  if (filter.category) {
    whereClause.category_id = filter.category;
  }

  whereClause.deleted_at = null;
  whereClause.is_active = true;

  let orderByClause;
  switch (filter.sort) {
    case "best_seller":
      orderByClause = { total_sale: "desc" };
      break;
    case "lowest_price":
      orderByClause = { price: "asc" };
      break;
    case "highest_price":
      orderByClause = { price: "desc" };
      break;
    default:
      orderByClause = {
        created_at: "desc",
      };
  }

  const skip = (filter.page - 1) * filter.limit;
  const [total, data] = await Promise.all([
    prismaClient.product.count({ where: whereClause }),
    prismaClient.product.findMany({
      where: whereClause,
      // select will include category and variants
      select: handleSelect(reqUser),
      take: filter.limit,
      skip: skip,
      orderBy: orderByClause,
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
  const product = await prismaClient.product.findUnique({
    where: { id },
    // select will include category and variants
    select: handleSelect(reqUser),
  });

  if (!product) throw new ResponseError(404, "Product not found");
  return product;
};

const insert = async (reqBody, file) => {
  // ✅ 'variants' is already parsed into an array by Joi validation
  // So no need to JSON.parse(reqBody.variants) manually
  const product = validate(productInsertValidation, reqBody);

  if (product.discount !== undefined && product.discount > 100) {
    throw new ResponseError(400, "Discount must not exceed 100%");
  }
  await validationCategoryProduct(product.category_id);

  const result = await uploadStreamClodinary(file.buffer);
  product.image_url = result?.secure_url;

  let createdProduct;
  await prismaClient.$transaction(async (tx) => {
    createdProduct = await tx.product.create({
      data: {
        name: product.name,
        cost_price: product.cost_price,
        price: product.price,
        category_id: product.category_id,
        description: product.description,
        img_url: product.image_url,
        discount: product.discount,
        product_variants: {
          createMany: {
            data: product.variants.map((v) => ({
              name: v.name,
              price_diff: Number(v.price_diff),
              stock: Number(v.stock),
              is_active: Number(v.stock) > 0,
            })),
          },
        },
      },
      include: {
        product_variants: true,
      },
    });
  });
  return createdProduct;
};

const patchProduct = async (id, reqBody, file) => {
  // check is product exists and select variants id
  const product = await prismaClient.product.findFirst({
    where: { id },
    include: { product_variants: { select: { id: true } } },
  });

  if (!product) throw new ResponseError(404, "Product not found");

  // validation body
  const updateProductReq = validate(productPatchValidation, reqBody);

  // check category id
  if (updateProductReq.category_id) {
    await validationCategoryProduct(updateProductReq.category_id);
  }

  // check product_variant belongs to product
  let updateVariantsReq;
  if (updateProductReq.variants) {
    const validVariantId = product.product_variants.map((v) => v.id);

    for (const variant of updateProductReq.variants) {
      if (!validVariantId.includes(variant.id)) {
        throw new ResponseError(
          400,
          `Variant with ID ${variant.id} does not belong to this product`
        );
      }
    }
    // set updateVariantReq if check success
    updateVariantsReq = updateProductReq.variants;
    delete updateProductReq.variants;
  }

  // handle if have file
  if (file) {
    updateProductReq.img_url = await processUpdateImage(file, product.img_url);
  }

  // start update
  return await prismaClient.$transaction(async (tx) => {
    // update product
    await tx.product.update({
      where: { id },
      data: updateProductReq,
    });

    if (!updateVariantsReq) return { id, ...updateProductReq };

    // update variants
    const variantTemp = [];
    for (const variant of updateVariantsReq) {
      // split id and data variants
      const { id: variantId, ...varianttData } = variant;

      const variantUpated = await tx.productVariant.update({
        where: { id: variantId },
        data: varianttData,
      });

      variantTemp.push(variantUpated);
    }

    return { id, ...updateProductReq, product_variants: variantTemp };
  });
};

const destroy = async (id) => {
  // count product
  const product = await prismaClient.product.findUnique({ where: { id } });
  if (!product) throw new ResponseError(404, "Product not found");

  // check product has order
  const hasOrder = await prismaClient.orderItem.findFirst({
    where: {
      product_variant: {
        product_id: id,
      },
    },
  });

  // run soft delete if has order
  if (hasOrder) {
    return await prismaClient.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          deleted_at: new Date(),
          is_active: false,
        },
      });

      await tx.productVariant.updateMany({
        where: { product_id: id },
        data: {
          deleted_at: new Date(),
          is_active: false,
        },
      });

      await tx.cartItem.deleteMany({
        where: {
          product_variant: {
            product_id: id,
          },
        },
      });
    });
  }

  // hard delete
  await prismaClient.$transaction(async (tx) => {
    await tx.cartItem.deleteMany({
      where: {
        product_variant: {
          product_id: id,
        },
      },
    });

    await tx.productVariant.deleteMany({
      where: {
        product_id: id,
      },
    });

    await tx.product.delete({
      where: { id },
    });
  });

  try {
    const publicId = getPublicIdCloudinary(product.img_url);
    await deleteFromCloudinary(publicId);
  } catch (error) {
    logger.error(error.message);
    throw new UploadError(500, "Error delete image product");
  }
};

async function validationCategoryProduct(categoryId) {
  const countCategory = await prismaClient.category.count({
    where: {
      id: categoryId,
    },
  });

  if (countCategory < 1) throw new ResponseError(404, "Category not found");

  const countParent = await prismaClient.category.count({
    where: {
      id: categoryId,
      parent_id: null,
    },
  });

  if (countParent > 0)
    throw new ResponseError(400, "Category must be subcategory or children");
}

function handleSelect(reqUser) {
  const select = {
    id: true,
    name: true,
    price: true,
    category_id: true,
    is_active: true,
    deleted_at: true,
    description: true,
    discount: true,
    img_url: true,
    total_sale: true,
    updated_at: true,
    created_at: true,
    category: {
      select: {
        id: true,
        name: true,
        slug: true,
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    },
    product_variants: true,
  };

  if (reqUser && reqUser.role?.toLowerCase() === "admin") {
    select.cost_price = true;
  }

  return select;
}

export default {
  getAll,
  findById,
  insert,
  patchProduct,
  destroy,
};
