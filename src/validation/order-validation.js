import Joi from "joi";
import { addressInsertValidation } from "./address-validation.js";

export const orderCreateValidation = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        product_variant_id: Joi.number().required(),
        quantity: Joi.number().min(1).required(),
      })
    )
    .min(1)
    .required(),
});

export const orderCreatePaymentValidation = Joi.object({
  shipping_courier: Joi.string().max(100).required(),
  bank: Joi.string()
    .max(50)
    .required()
    .custom((value, helper) => {
      const allowedBanks = ["bca", "bni", "bri", "cimb"];
      const lowerValue = value.toLowerCase();

      if (!allowedBanks.includes(lowerValue)) {
        return helper.message("Allowed bank: BCA, BNI, BRI, CIMB");
      }

      return lowerValue;
    }),

  address: addressInsertValidation,
});

export const orderCreateValidationBank = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        product_variant_id: Joi.number().required(),
        quantity: Joi.number().min(1).required(),
      })
    )
    .min(1)
    .required(),
  address_id: Joi.number().required(),
  shipping_courier: Joi.string().max(100).required(),
  bank: Joi.string()
    .max(50)
    .required()
    .custom((value, helper) => {
      const allowedBanks = ["bca", "bni", "bri", "cimb"];
      const lowerValue = value.toLowerCase();

      if (!allowedBanks.includes(lowerValue)) {
        return helper.message("Allowed bank: BCA, BNI, BRI, CIMB");
      }

      return lowerValue;
    }),
});

export const orderPatchValidation = Joi.object({
  status: Joi.string()
    .optional()
    .empty("")
    .custom((value, helper) => {
      const valueLower = value.toLowerCase();
      const allowed = [
        "pending",
        "progress",
        "canceled",
        "shipping",
        "completed",
      ];

      if (!allowed.includes(valueLower)) return helper.error("any.invalid");
      return valueLower;
    })
    .messages({
      "any.invalid": "Status not allowed",
      "string.empty": "Status must not be empty",
    }),

  payment_status: Joi.string()
    .optional()
    .empty("")
    .custom((value, helper) => {
      const valueLower = value.toLowerCase();
      const allowed = ["pending", "settlement", "paid", "expired", "canceled"];

      if (!allowed.includes(valueLower)) return helper.error("any.invalid");
      return valueLower;
    })
    .messages({
      "any.invalid": "Payment status not allowed",
      "string.empty": "Payment status must not be empty",
    }),

  tracking_number: Joi.string().optional().empty("").messages({
    "string.empty": "Tracking number must not be empty",
  }),
});
