import categoryService from "../service/category-service.js";
import { parseIntOrThrow } from "../utils/util.js";

const getAll = async (req, res, next) => {
  try {
    const { search, type, page, limit, slug } = req.query;
    const filter = {};

    filter.limit = limit
      ? parseIntOrThrow(limit, "Limit filter must be a number")
      : 10;

    filter.page = page
      ? parseIntOrThrow(page, "Page filter must be a number")
      : 1;

    filter.search = search;
    filter.type = type;
    filter.slug = slug;

    const { data, total_page, total_data } = await categoryService.findAll(
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
    const idInt = parseIntOrThrow(id, "ID must be a number");
    const data = await categoryService.findById(idInt);
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
};
const create = async (req, res, next) => {
  try {
    req.body.parent_id = req.body.parent_id ? req.body.parent_id : null;
    const data = await categoryService.create(req.body);
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    req.body.parent_id = req.body.parent_id ? req.body.parent_id : null;
    const data = await categoryService.update(parseInt(id), req.body);
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
};

const destroy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await categoryService.destroy(parseInt(id));
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
};

export default {
  create,
  update,
  destroy,
  getAll,
  getById,
};
