import Joi from "joi";

export const productInsertValidation = Joi.object({
  name: Joi.string().required(),
  cost_price: Joi.alternatives()
    .try(Joi.number(), Joi.string())
    .custom((value, helpers) => {
      const num = Number(value);
      if (isNaN(num)) {
        return helpers.error("number.base");
      }
      if (num <= 0) {
        return helpers.error("number.positive");
      }
      return num;
    })
    .required(),
  price: Joi.alternatives()
    .try(Joi.number(), Joi.string())
    .custom((value, helpers) => {
      const num = Number(value);
      if (isNaN(num)) {
        return helpers.error("number.base");
      }
      if (num <= 0) {
        return helpers.error("number.positive");
      }
      return num;
    })
    .required(),
  discount: Joi.alternatives()
    .try(Joi.number(), Joi.string())
    .custom((value, helpers) => {
      if (value === null || value === undefined || value === "") {
        return null;
      }
      const num = Number(value);
      if (isNaN(num)) {
        return helpers.error("number.base");
      }
      if (num <= 0) {
        return helpers.error("number.positive");
      }
      return num;
    })
    .optional()
    .allow(null),
  category_id: Joi.number().integer().required(),
  description: Joi.string().required(),
  variants: Joi.string()
    .required()
    .custom((value, helpers) => {
      try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) return helpers.error("any.invalid");

        for (const item of parsed) {
          const variantSchema = Joi.object({
            name: Joi.string().required(),
            price_diff: Joi.number().integer().required(),
            stock: Joi.number().integer().required(),
          });

          const { error } = variantSchema.validate(item);
          if (error) return helpers.error("any.invalid");
        }

        return parsed; // parsed array yang valid
      } catch (error) {
        return helpers.error("any.invalid");
      }
    })
    .messages({
      "string.base": "Variants must be a string (in JSON format)",
      "any.invalid":
        "Variants must be a valid JSON array string with proper fields",
    }),
});

export const productPatchValidation = Joi.object({
  name: Joi.string().optional(),
  cost_price: Joi.number().integer().optional(),
  price: Joi.number().integer().optional(),
  discount: Joi.number().integer().optional().allow(null),
  category_id: Joi.number().integer().optional(),
  description: Joi.string().optional(),
  is_active: Joi.boolean().optional(),

  variants: Joi.string()
    .optional()
    .custom((value, helpers) => {
      try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) return helpers.error("any.invalid");

        for (const item of parsed) {
          const variantSchema = Joi.object({
            id: Joi.number().required(),
            name: Joi.string().optional(),
            price_diff: Joi.number().integer().optional(),
            stock: Joi.number().integer().optional(),
            is_active: Joi.boolean().optional(),
          });

          const { error } = variantSchema.validate(item);
          if (error) return helpers.error("any.invalid");
        }

        return parsed; // parsed array yang valid
      } catch (err) {
        return helpers.error("any.invalid");
      }
    })
    .messages({
      "string.base": "Variants must be a string (in JSON format)",
      "any.invalid":
        "Variants must be a valid JSON array string with proper fields",
    }),
});
