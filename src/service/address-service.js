import { prismaClient } from "../app/database.js";
import { ResponseError } from "../error/response-error.js";
import { validate } from "../validation/validate.js";
import {
  addressInsertValidation,
  addressPatchValidation,
} from "../validation/address-validation.js";

const findByUser = async (userId, reqUser) => {
  if (userId !== reqUser.id && reqUser.role !== "admin")
    throw new ResponseError(403, "access denied");

  return await prismaClient.address.findMany({
    where: {
      user_id: userId,
      deleted_at: null,
    },
  });
};

const insert = async (userId, reqBody, reqUser) => {
  const countUser = await prismaClient.user.count({ where: { id: userId } });
  if (countUser < 1) throw new ResponseError(404, "User not found");

  if (userId !== reqUser.id && reqUser.role !== "admin")
    throw new ResponseError(403, "access denied");

  const addressReq = validate(addressInsertValidation, reqBody);
  addressReq.user_id = userId;

  return await prismaClient.address.create({
    data: addressReq,
  });
};
const patchAddress = async (id, userId, reqBody, reqUser) => {
  const address = await prismaClient.address.findUnique({
    where: { id, user_id: userId },
  });
  if (!address) throw new ResponseError(404, "Address not found");

  if (address.user_id !== reqUser.id && reqUser.role !== "admin")
    throw new ResponseError(403, "access denied");

  const addressReq = validate(addressPatchValidation, reqBody);

  return await prismaClient.address.update({
    where: { id },
    data: addressReq,
  });
};

const destroy = async (userId, addressId, reqUser) => {
  const address = await prismaClient.address.findUnique({
    where: { id: addressId, user_id: userId },
  });
  if (!address) throw new ResponseError(404, "Address not found");

  if (address.user_id !== reqUser.id && reqUser.role !== "admin")
    throw new ResponseError(403, "access denied");

  // hard delete
  return await prismaClient.address.delete({
    where: { id: address.id, user_id: userId },
  });
};

export default {
  findByUser,
  insert,
  patchAddress,
  destroy,
};
