```js
import { Router } from "express";
// Import Express Router to create modular and mountable route handlers

import { login, logout, registerUser } from "../controllers/auth.controller.js";
// Controller functions:
// - registerUser → handles new user registration
// - login → handles user login (generates tokens)
// - logout → handles user logout (clears cookies, refreshToken in DB)

import { validate } from "../middlewares/validator.middleware.js";
// Middleware: checks for validation errors after express-validator runs
// If errors exist → sends 422 response, else continues

import {
  userRegisterValidator,
  userLoginValidator,
} from "../validator/index.js";
// Custom validators (express-validator rules):
// - userRegisterValidator → checks fields for registration (email, username, password...)
// - userLoginValidator → checks fields for login (email, password)

import { verifyJWT } from "../middlewares/JWTauth.middleware.js";
// Middleware: verifies JWT token from cookie or header
// If valid → attaches user to req.user, else throws unauthorized error

const router = Router();
// Create a new router instance

// Route for POST /register
router.route("/register").post(
  userRegisterValidator(), // ✅ Step 1: Apply validation rules for registration
  validate, // ✅ Step 2: Check if validation errors exist
  registerUser, // ✅ Step 3: If valid → run controller to register user
);

// Route for POST /login
router.route("/login").post(
  userLoginValidator(), // ✅ Step 1: Apply validation rules for login
  validate, // ✅ Step 2: Check for validation errors
  login, // ✅ Step 3: If valid → run login controller
);

// Route for POST /logout
router.route("/logout").post(
  verifyJWT, // ✅ Step 1: Verify access token (must be logged in)
  logout, // ✅ Step 2: If valid → run controller to log user out
);

export default router;
// Export the router so it can be mounted in main app (e.g., app.use("/api/v1/auth", router))
```
