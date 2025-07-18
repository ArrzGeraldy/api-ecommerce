import { ResponseError } from "../error/response-error.js";
import cartItemService from "../service/cart-item-service.js";
import { parseIntOrThrow } from "../utils/util.js";

const getByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const userIdInt = parseIntOrThrow(userId, "user id must be a number");
    if (!req.user) throw new ResponseError(401, "Unauthorized");

    const data = await cartItemService.findByUser(userIdInt, req.user);
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const userIdInt = parseIntOrThrow(userId, "user id must be a number");
    if (!req.user) throw new ResponseError(401, "Unauthorized");

    const result = await cartItemService.insert(userIdInt, req.body, req.user);
    res.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
};

const edit = async (req, res, next) => {
  try {
    const { userId, id } = req.params;
    const userIdInt = parseIntOrThrow(userId, "user id must be a number");
    const cartId = parseIntOrThrow(id, "cart id must be a number");

    if (!req.user) throw new ResponseError(401, "Unauthorized");

    const result = await cartItemService.patchCartItem(
      cartId,
      userIdInt,
      req.body,
      req.user
    );
    res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
};

const destroy = async (req, res, next) => {
  try {
    const { userId, id } = req.params;
    const userIdInt = parseIntOrThrow(userId, "user id must be a number");
    const cartId = parseIntOrThrow(id, "cart id must be a number");

    if (!req.user) throw new ResponseError(401, "Unauthorized");

    const result = await cartItemService.destroy(cartId, userIdInt, req.user);
    res.status(200).json({ data: null });
  } catch (error) {
    next(error);
  }
};

export default {
  getByUser,
  create,
  edit,
  destroy,
};
