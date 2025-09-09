```js
class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something Went Wrong",
    errors = [],
    stack = "",
  ) {
    // Call parent class constructor (Error) with the message
    super(message);

    // HTTP status code (e.g., 400, 401, 404, 500)
    this.statusCode = statusCode;

    // Data is always null in case of error
    this.data = null;

    // Error message (default: "Something Went Wrong")
    this.message = message;

    // Boolean flag → false because it's always an error
    this.success = false;

    // Array of detailed errors (can hold validation errors, etc.)
    this.errors = errors;

    // Stack trace → useful for debugging
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
```

## Example Usage:

```js
import { ApiError } from "./api-error.js";

// ❌ Validation error
const err1 = new ApiError(400, "Invalid input", ["Email is required"]);
console.log(err1);
/*
{
  statusCode: 400,
  data: null,
  message: "Invalid input",
  success: false,
  errors: ["Email is required"],
  stack: ... (error trace)
}
*/

// ❌ Server error with default message
const err2 = new ApiError(500);
console.log(err2);
/*
{
  statusCode: 500,
  data: null,
  message: "Something Went Wrong",
  success: false,
  errors: [],
  stack: ... (error trace)
}
*/
```

## 🔹 Problem without constructor

```js
throw new Error("User not found");
throw new Error("Invalid input");
```

### ⚠️ Issues

- **No status code** → hard to distinguish between client error (400) and server error (500).
- **Inconsistent format** → each error may have different properties.
- **No structured errors** → hard to include validation errors.
- **Debugging issues** → stack traces are not standardized.

## 🔹 How constructor helps

```js
new ApiError(404, "User not found");
// 👆 Creates { statusCode: 404, data: null, message: "User not found", success: false, errors: [] }

new ApiError(400, "Invalid input", ["Email is required"]);
// 👆 Creates { statusCode: 400, data: null, message: "Invalid input", success: false, errors: ["Email is required"] }
```
