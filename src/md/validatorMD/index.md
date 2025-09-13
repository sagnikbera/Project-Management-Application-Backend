```js
import { body } from "express-validator";
// `body()` is used to validate fields inside req.body

// Validator function for user registration
const userRegisterValidator = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email id required!")
      .isEmail()
      .withMessage("Email is invalid!"),

    body("username")
      .trim()
      .notEmpty()
      .withMessage("username is required!")
      .isLowercase()
      .withMessage("Username must be in lowercase!")
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters!"),

    body("password").trim().notEmpty().withMessage("Password is required!"),

    body("fullname").optional().trim(),
  ];
};
// Export validator so it can be used in routes
export { userRegisterValidator };
```

---

---

## 🔹 What is express-validator?

- A middleware library for Express.js.
- Used to validate and sanitize request data (req.body, req.params, req.query).
- Helps prevent invalid or malicious input before it reaches your controller.

---

---

## 🔹 Core Methods / Functions

### 1. check() / body() / param() / query()

---

- `check(field, message)` → validate any field (in body, query, or params).- `body(field)` → specifically validate `req.body[field]`.
- `param(field)` → validate `req.params[field]`.
- `query(field)` → validate `req.query[field]`.

#### Example

```js
import { body, param } from "express-validator";

[
  body("email").isEmail().withMessage("Invalid email format"),
  body("password").isLength({ min: 6 }).withMessage("Password too short"),
  param("id").isMongoId().withMessage("Invalid user ID"),
];
```

### 2. validationResult(req)

- Collects all errors from validation.
- Returns a `Result` object with methods like `.isEmpty()` and `.array()`.

#### Example

```js
import { validationResult } from "express-validator";

const errors = validationResult(req);
if (!errors.isEmpty()) {
  return res.status(400).json({ errors: errors.array() });
}
```

### 3. withMessage(message)

- Adds a **custom error message** to a validation rule.

#### Example

```js
body("password")
  .isLength({ min: 6 })
  .withMessage("Password must be at least 6 characters long");
```
