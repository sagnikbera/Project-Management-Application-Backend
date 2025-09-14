import { Router } from "express";
import { login, logout, registerUser } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import {
  userRegisterValidator,
  userLoginValidator,
} from "../validator/index.js";

import { verifyJWT } from "../middlewares/JWTauth.middleware.js";

const router = Router();

router.route("/register").post(userRegisterValidator(), validate, registerUser);
router.route("/login").post(userLoginValidator(), validate, login);
router.route("/logout").post(verifyJWT, logout);

export default router;
