import {
  loginUserValidation,
  registerUserValidation,
} from "../validation/user-validation.js";
import { validate } from "../validation/validate.js";
import { prismaClient } from "../app/database.js";
import { ResponseError } from "../error/response-error.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../app/config.js";
import { logger } from "../app/logger.js";

const register = async (req) => {
  const user = validate(registerUserValidation, req);

  const count = await prismaClient.user.count({
    where: {
      email: user.email,
    },
  });

  if (count != 0) {
    throw new ResponseError(400, "Email already registred");
  }

  user.password = await bcrypt.hash(user.password, 10);

  return prismaClient.user.create({
    data: user,
    select: {
      username: true,
      email: true,
    },
  });
};

const login = async (req) => {
  const loginReq = validate(loginUserValidation, req);

  const user = await prismaClient.user.findUnique({
    where: {
      email: loginReq.email,
    },
    select: {
      id: true,
      username: true,
      email: true,
      password: true,
      role: true,
      deleted_at: true,
      is_blocked: true,
    },
  });

  if (!user) throw new ResponseError(400, "Invalid email or password");

  if (user.deleted_at)
    throw new ResponseError(400, "Invalid email or password");

  const isPasswordValid = await bcrypt.compare(
    loginReq.password,
    user.password
  );

  if (!isPasswordValid)
    throw new ResponseError(400, "Invalid email or password");

  if (user.is_blocked)
    throw new ResponseError(400, "This account already blocked");

  const userInfo = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(userInfo, config.accessTokenSecret, {
    expiresIn: "1h",
  });

  const refreshToken = jwt.sign(userInfo, config.refreshTokenSecret, {
    expiresIn: "7d",
  });

  await prismaClient.user.update({
    where: {
      email: user.email,
    },
    data: {
      token: refreshToken,
    },
  });

  return { accessToken, refreshToken };
};

export const logout = async (token) => {
  let decoded;
  try {
    decoded = jwt.verify(token, config.refreshTokenSecret);
  } catch (err) {
    throw new ResponseError(403, "Invalid token");
  }

  const user = await prismaClient.user.findFirst({
    where: {
      id: decoded.id,
      token: token,
    },
  });

  if (!user) throw new ResponseError(403, "Access denied");

  await prismaClient.user.update({
    where: {
      id: user.id,
    },
    data: {
      token: null,
    },
  });
};

const refresh = async (token) => {
  let decoded;
  try {
    decoded = jwt.verify(token, config.refreshTokenSecret);
  } catch (err) {
    throw new ResponseError(403, "Invalid token");
  }

  const user = await prismaClient.user.findFirst({
    where: {
      id: decoded.id,
      token: token,
    },
  });

  if (!user) throw new ResponseError(403, "Access denied");

  const userInfo = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(userInfo, config.accessTokenSecret, {
    expiresIn: "1h",
  });
};

export default {
  login,
  register,
  logout,
  refresh,
};
