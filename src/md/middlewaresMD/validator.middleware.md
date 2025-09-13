```js
import { validationResult } from "express-validator";
// `validationResult` collects validation results from express-validator rules

import { ApiError } from "../utils/api-error.js";
// Custom error class for sending consistent error responses

// Middleware to validate request body/query/params
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  // Extract all validation errors for this request

  if (errors.isEmpty()) {
    // ✅ If no validation errors, move to next middleware/controller
    return next();
  }

  const extractedErros = []; // Will store formatted error messages

  // Loop through each error and push into array in key:value format
  errors.array().map((err) =>
    extractedErros.push({
      [err.path]: err.msg, // e.g., { "email": "Invalid email format" }
    }),
  );

  // ❌ Throw custom error with status 422 (Unprocessable Entity)
  throw new ApiError(422, "Recieved data is not valid", extractedErros);
};
```
