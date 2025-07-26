import variantsService from "../service/variant-service.js";
import { parseIntOrThrow } from "../utils/util.js";

const destroy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idInt = parseIntOrThrow(id, "ID must be a number");
    await variantsService.destroy(idInt);
    res.status(200).json({ data: null });
  } catch (error) {
    next(error);
  }
};

export default {
  destroy,
};
