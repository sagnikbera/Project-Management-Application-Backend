```js
import { validationResult } from "express-validator";
import { ApiError } from "../utils/api-error.js";

/**
 * ✅ Middleware: validate
 * - Runs after express-validator checks
 * - Collects validation errors (if any)
 * - If no errors -> passes control to the next middleware/controller
 * - If errors exist -> throws ApiError(422) with detailed field-specific messages
 */
export const validate = (req, res, next) => {
  // 🔹 1. Extract validation errors from the request
  const errors = validationResult(req);

  // ✅ If no errors, continue to next middleware/controller
  if (errors.isEmpty()) {
    return next();
  }

  // 🔹 2. Format errors into a cleaner array
  const extractedErrors = [];
  errors.array().map((err) =>
    extractedErrors.push({
      [err.path]: err.msg, // key = field name, value = error message
    }),
  );

  // ❌ 3. Throw API error with all validation issues
  throw new ApiError(422, "Received data is not valid", extractedErrors);
};
```
