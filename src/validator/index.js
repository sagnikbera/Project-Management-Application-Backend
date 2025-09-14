import { body } from "express-validator";

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

const userLoginValidator = () => {
  return [
    body("email").optional().isEmail().withMessage("Email is invalid"),

    body("password").notEmpty().withMessage("Password is required!"),
  ];
};

export { userRegisterValidator, userLoginValidator };
