```js
import { Router } from "express";
// Import Express Router to create modular route handlers

import { registerUser } from "../controllers/auth.controller.js";
// Controller function: handles the actual registration logic (saving user, sending email, etc.)

import { validate } from "../middlewares/validator.middleware.js";
// Middleware: checks for validation errors from express-validator and returns 422 if invalid

import { userRegisterValidator } from "../validator/index.js";
// Custom validator: contains validation rules for registering a user (email, username, password, fullname)

const router = Router(); // Create a new router instance

// Define route for POST /register
router.route("/register").post(
  userRegisterValidator(), // ✅ Step 1: Apply validation rules to request body
  validate, // ✅ Step 2: If errors → stop and return 422 response
  registerUser, // ✅ Step 3: If no errors → execute controller to register the user
);

export default router;
// Export this router so it can be mounted in the main app (e.g., app.use("/api/auth", router))
```
