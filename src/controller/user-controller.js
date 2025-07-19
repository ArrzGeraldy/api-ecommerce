import { ResponseError } from "../error/response-error.js";
import userService from "../service/user-service.js";
import { parseIntOrThrow } from "../utils/util.js";

const getAll = async (req, res, next) => {
  try {
    const filter = {};
    const { search, deleted, blocked, limit, page } = req.query;
    filter.deleted = deleted === "true" && true;
    filter.blocked = blocked === "true" && true;

    if (search) {
      if (search.trim() === "")
        throw new ResponseError(400, "Invalid value filter search");
    }

    filter.search = search;

    filter.limit = limit
      ? parseIntOrThrow(limit, "Limit filter must be a number")
      : 10;
    filter.page = page
      ? parseIntOrThrow(page, "Page filter must be a number")
      : 1;

    const { data, total_data, total_page } = await userService.findAll(filter);

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
    const idInt = parseIntOrThrow(id, "ID must be a number");
    const data = await userService.findById(idInt, req.user);
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
};

const edit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idInt = parseIntOrThrow(id, "ID must be a number");
    const data = await userService.patchUser(idInt, req.body, req.user);
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
};

const destroy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idInt = parseIntOrThrow(id, "ID must be a number");
    const data = await userService.destroy(idInt);
    res.status(200).json({ data: null });
  } catch (error) {
    next(error);
  }
};

export default {
  getById,
  getAll,
  edit,
  destroy,
};
