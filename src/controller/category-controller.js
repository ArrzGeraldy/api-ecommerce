import categoryService from "../service/category-service.js";

const findAll = async (req, res, next) => {
  try {
    const data = await categoryService.getCategoryTree();
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
  findAll,
  create,
  update,
  destroy,
};
