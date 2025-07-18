import Joi from "joi";

export const cartItemInsertValidation = Joi.object({
  product_variant_id: Joi.number().integer().required(),
  quantity: Joi.number().integer().min(1).required(),
});

export const cartItemUpdateValidation = Joi.object({
  quantity: Joi.number().integer().min(1).optional(),
});
