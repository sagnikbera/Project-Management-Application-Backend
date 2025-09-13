import { validationResult } from "express-validator";
import { ApiError } from "../utils/api-error.js";

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const extractedErros = [];

  errors.array().map((err) =>
    extractedErros.push({
      [err.path]: err.msg,
    }),
  );

  throw new ApiError(422, "Recieved data is not valid", extractedErros);
};
