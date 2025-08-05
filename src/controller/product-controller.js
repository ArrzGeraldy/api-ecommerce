import { ResponseError } from "../error/response-error.js";
import productService from "../service/product-service.js";
import { parseIntOrThrow } from "../utils/util.js";

const getAll = async (req, res, next) => {
  try {
    const filter = {};
    const { search, category, parent, limit, page, sort } = req.query;

    filter.search = search;
    filter.parent = parent;
    filter.sort = sort;

    if (category !== undefined) {
      filter.category = parseIntOrThrow(
        category,
        "Category filter must be a number"
      );
    }

    filter.limit =
      limit !== undefined
        ? parseIntOrThrow(limit, "Limit filter must be a number")
        : 10;

    filter.page =
      page !== undefined
        ? parseIntOrThrow(page, "Page filter must be a number")
        : 1;

    const { data, total_page, total_data } = await productService.getAll(
      filter,
      req.user
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

const findById = async (req, res, next) => {
  try {
    const data = await productService.findById(req.params.id, req.user);

    res.status(200).json({
      data,
    });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    if (!req.file) throw new ResponseError(400, "Image file is required");
    req.body = { ...req.body };

    req.body.price = Number(req.body.price);
    if (isNaN(req.body.price))
      throw new ResponseError(400, "Price must be a number");
    req.body.category_id = Number(req.body.category_id);
    if (isNaN(req.body.category_id))
      throw new ResponseError(400, "Category id must be a number");

    const data = await productService.insert(req.body, req.file);

    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
};

const edit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await productService.patchProduct(id, req.body, req.file);
    res.status(200).json({ data: updated });
  } catch (error) {
    next(error);
  }
};

const destroy = async (req, res, next) => {
  try {
    const { id } = req.params;

    await productService.destroy(id);

    res.status(200).json({ data: null });
  } catch (error) {
    next(error);
  }
};

export default {
  getAll,
  findById,
  create,
  edit,
  destroy,
};
