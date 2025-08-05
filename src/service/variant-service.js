import { prismaClient } from "../app/database.js";
import { ResponseError } from "../error/response-error.js";

const destroy = async (id) => {
  const variantCount = await prismaClient.productVariant.count({
    where: { id },
  });
  if (variantCount < 1) throw new ResponseError(404, "Varaint not found");

  // variant is belongs to orderItem
  // run soft delete is belong
  const orderItemCount = await prismaClient.orderItem.count({
    where: { product_variant_id: id },
  });

  if (orderItemCount < 0) {
    await prismaClient.productVariant.update({
      where: { id },
      data: {
        deleted_at: new Date(),
      },
    });

    return null;
  }

  // run hard delete
  await prismaClient.productVariant.delete({
    where: { id },
  });
};
export default {
  destroy,
};
