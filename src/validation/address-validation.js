import Joi from "joi";

export const addressInsertValidation = Joi.object({
  recipient_name: Joi.string().max(100).required(),
  phone: Joi.string().max(20).required(),
  province: Joi.string().max(100).required(),
  city: Joi.string().max(100).required(),
  postal_code: Joi.string().max(10).required(),
  is_primary: Joi.boolean().optional(),
  detail: Joi.string().optional(),
});

export const addressPatchValidation = Joi.object({
  recipient_name: Joi.string().max(100).optional(),
  phone: Joi.string().max(20).optional(),
  province: Joi.string().max(100).optional(),
  city: Joi.string().max(100).optional(),
  postal_code: Joi.string().max(10).optional(),
  is_primary: Joi.boolean().optional(),
  detail: Joi.string().optional(),
});
