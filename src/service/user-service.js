import { prismaClient } from "../app/database.js";
import { ResponseError } from "../error/response-error.js";
import { authorizeUserOrAdmin } from "../utils/authorizatioin-util.js";
import { validate } from "../validation/validate.js";
import { userParchValidaiton } from "../validation/user-validation.js";

// find all user !deleted_at include filter
const findAll = async (filter) => {
  const whereClause = {};

  if (filter?.deleted === true) {
    whereClause.deleted_at = { not: null };
  } else {
    whereClause.deleted_at = null;
  }

  if (filter?.blocked === true) {
    whereClause.is_blocked = true;
  }

  if (filter.search) {
    whereClause.OR = [
      {
        username: {
          contains: filter.search,
          mode: "insensitive",
        },
      },
      {
        email: {
          contains: filter.search,
          mode: "insensitive",
        },
      },
    ];
  }
  const skip = (filter.page - 1) * filter.limit;

  const [total, data] = await Promise.all([
    prismaClient.user.count({ where: whereClause }),
    prismaClient.user.findMany({
      where: whereClause,
      take: filter.limit,
      select: {
        id: true,
        is_blocked: true,
        deleted_at: true,
        email: true,
        username: true,
        role: true,
      },
      skip: skip,
      orderBy: {
        created_at: "desc",
      },
    }),
  ]);

  const totalPage = Math.ceil(total / filter.limit);

  return { data, total_page: totalPage, total_data: total };
};

// find user by id
const findById = async (id, reqUser) => {
  const user = await prismaClient.user.findUnique({
    where: { id, deleted_at: null },
    select: {
      id: true,
      is_blocked: true,
      deleted_at: true,
      email: true,
      username: true,
      role: true,
    },
  });

  if (!user) throw new ResponseError(404, "User not found");
  authorizeUserOrAdmin(user.id, reqUser);

  return user;
};

// patch username
const patchUser = async (id, reqBody, reqUser) => {
  const user = await prismaClient.user.findUnique({ where: { id } });
  authorizeUserOrAdmin(id, reqUser);

  if (!user) throw new ResponseError(404, "User not found");

  const userReq = validate(userParchValidaiton, reqBody);

  if (!userReq) throw new ResponseError(400, "No valid fields to update");

  if (userReq.is_blocked !== undefined && reqUser.role !== "admin")
    throw new ResponseError(403, "access denied");

  return await prismaClient.user.update({
    where: { id },
    data: userReq,
    select: {
      id: true,
      is_blocked: true,
      deleted_at: true,
      email: true,
      username: true,
      role: true,
    },
  });
};

// delete user
const destroy = async (id) => {
  const count = await prismaClient.user.count({
    where: {
      id,
      deleted_at: null,
    },
  });

  if (count < 1) throw new ResponseError(404, "User not found");

  await prismaClient.user.update({
    where: { id, deleted_at: null },
    data: {
      deleted_at: new Date(),
    },
  });
};

export default {
  findAll,
  findById,
  patchUser,
  destroy,
};
