import Joi from "joi";

export const registerUserValidation = Joi.object({
  username: Joi.string().max(100).min(4).required(),
  email: Joi.string().email().max(100).min(5).required(),
  password: Joi.string().max(255).min(8).required(),
});

export const loginUserValidation = Joi.object({
  email: Joi.string().email().max(100).min(5).required(),
  password: Joi.string().max(255).min(8).required(),
});

export const userParchValidaiton = Joi.object({
  username: Joi.string().max(100).min(4).optional(),
  is_blocked: Joi.bool().optional(),
});
