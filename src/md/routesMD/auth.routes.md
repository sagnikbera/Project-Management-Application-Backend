```js
import { Router } from "express";
// Import Express Router to create modular route handlers

import {
  changeCurrentPassword,
  forgotPasswordRequest,
  getCurrentUser,
  login,
  logout,
  refreshAccessToken,
  registerUser,
  resendEmailVerification,
  resetForgotPassword,
  verifyEmail,
} from "../controllers/auth.controller.js";
// Import all controller functions:
// - registerUser → handle user registration
// - login → handle user login (generate access & refresh tokens)
// - logout → clear refresh token and cookies
// - getCurrentUser → fetch logged-in user's info
// - changeCurrentPassword → change password for logged-in user
// - forgotPasswordRequest → request a password reset email
// - resetForgotPassword → reset password using token
// - verifyEmail → verify email using token
// - resendEmailVerification → resend verification email
// - refreshAccessToken → refresh JWT access token

import { validate } from "../middlewares/validator.middleware.js";
// Middleware: checks results from express-validator
// Throws 422 error if validation fails, else continues

import {
  userRegisterValidator,
  userLoginValidator,
  userForgotPasswordValidator,
  userResetForgotPasswordvalidator,
  userChangeCurrectPasswordValidator,
} from "../validator/index.js";
// Request validators for different routes:
// - userRegisterValidator → validates registration fields
// - userLoginValidator → validates login fields
// - userForgotPasswordValidator → validates forgot password email
// - userResetForgotPasswordvalidator → validates new password
// - userChangeCurrectPasswordValidator → validates old & new password

import { verifyJWT } from "../middlewares/JWTauth.middleware.js";
// Middleware: verifies JWT access token from cookie or Authorization header
// Attaches user object to req.user if valid
// Throws 401 if token is missing or invalid

const router = Router();
// Create new Express router instance

// --------------------- UNSECURE ROUTES ---------------------
// These routes are accessible without login

router.route("/register").post(
  userRegisterValidator(), // Step 1: validate request body
  validate, // Step 2: check validation results
  registerUser, // Step 3: controller handles user registration
);

router.route("/login").post(
  userLoginValidator(), // Step 1: validate login request
  validate, // Step 2: check validation results
  login, // Step 3: controller handles login
);

router.route("/verify-email/:verificationToken").get(
  verifyEmail, // Controller verifies email using token from URL
);

router.route("/refresh-token").post(
  refreshAccessToken, // Controller refreshes access token using refresh token
);

router.route("/forgot-password").post(
  userForgotPasswordValidator(), // Validate email for forgot password
  validate, // Check validation results
  forgotPasswordRequest, // Controller sends password reset email
);

router.route("/reset-password:resetToken").post(
  userResetForgotPasswordvalidator(), // Validate new password
  validate, // Check validation results
  resetForgotPassword, // Controller resets password using token
);

// --------------------- SECURE ROUTES ---------------------
// These routes require JWT authentication

router.route("/logout").post(
  verifyJWT, // Step 1: check JWT
  logout, // Step 2: clear refresh token & cookies
);

router.route("/current-user").post(
  verifyJWT, // Step 1: check JWT
  getCurrentUser, // Step 2: return logged-in user's info
);

router.route("/change-password").post(
  verifyJWT, // Step 1: check JWT
  userChangeCurrectPasswordValidator(), // Step 2: validate old & new password
  validate, // Step 3: check validation results
  changeCurrentPassword, // Step 4: update password
);

router.route("/resend-email-verification").post(
  verifyJWT, // Step 1: check JWT
  resendEmailVerification, // Step 2: resend verification email
);

export default router;
// Export router so it can be mounted in main app:
// e.g., app.use("/api/v1/auth", router)
```
