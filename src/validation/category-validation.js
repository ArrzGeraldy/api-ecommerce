import Joi from "joi";

export const categoryValidation = Joi.object({
  name: Joi.string().max(100).min(4).required(),
  parent_id: Joi.number().allow(null),
});
