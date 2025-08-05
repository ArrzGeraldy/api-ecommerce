import { ResponseError } from "../error/response-error.js";
import addressService from "../service/address-service.js";

const getByUser = async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    if (isNaN(userId)) throw new ResponseError(400, "user id must be a number");
    if (!req.user) throw new ResponseError(401, "Unauthorized");

    const data = await addressService.findByUser(userId, req.user);
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    if (isNaN(userId)) throw new ResponseError(400, "user id must be a number");
    if (!req.user) throw new ResponseError(401, "Unauthorized");

    const result = await addressService.insert(userId, req.body, req.user);
    res.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
};

const edit = async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    const addressId = Number(req.params.id);

    if (isNaN(userId) || isNaN(addressId))
      throw new ResponseError(400, "Invalid ID(s)");
    if (!req.user) throw new ResponseError(401, "Unauthorized");

    const result = await addressService.patchAddress(
      addressId,
      userId,
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
    const userId = Number(req.params.userId);
    const addressId = Number(req.params.id);

    if (isNaN(userId) || isNaN(addressId))
      throw new ResponseError(400, "Invalid ID(s)");
    if (!req.user) throw new ResponseError(401, "Unauthorized");

    const result = await addressService.destroy(userId, addressId, req.user);
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
