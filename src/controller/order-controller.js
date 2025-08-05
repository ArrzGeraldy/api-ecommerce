import { ResponseError } from "../error/response-error.js";
import orderService from "../service/order-service.js";
import { parseIntOrThrow } from "../utils/util.js";

const getAll = async (req, res, next) => {
  try {
    const filter = handleFilter(req.query);
    const { data, total_data, total_page } = await orderService.findAll(filter);

    res.status(200).json({
      data,
      total_page,
      current_page: filter.page,
      total_data,
      per_page: filter.limit,
    });
  } catch (error) {
    next(error);
  }
};

const getByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const userIdInt = parseIntOrThrow(userId, "user id must be a number");
    const filter = handleFilter(req.query);

    const { data, total_data, total_page } = await orderService.findByUser(
      userIdInt,
      req.user,
      filter
    );

    res.status(200).json({
      data,
      total_page,
      current_page: filter.page,
      total_data,
      per_page: filter.limit,
    });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) throw new ResponseError(400, "id is required");
    const data = await orderService.findById(id, req.user);

    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
};

const createOrder = async (req, res, next) => {
  try {
    const data = await orderService.createOrder(req.user.id, req.body);

    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
};

const createPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) throw new ResponseError(400, "iD order is required");
    const data = await orderService.createPayment(id, req.body);

    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
};

const edit = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) throw new ResponseError(400, "id is required");
    const data = await orderService.patchOrder(id, req.body);
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
};

function handleFilter(query) {
  const { status, limit, page } = query;

  const filter = {
    status,
    limit: limit ? parseIntOrThrow(limit, "limit must be a number") : 10,
    page: page ? parseIntOrThrow(page, "page must be a number") : 1,
  };

  return filter;
}

export default {
  getAll,
  getById,
  edit,
  getByUser,
  createOrder,
  createPayment,
};
