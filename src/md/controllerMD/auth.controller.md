```js
import { User } from "../models/user.models.js"; // Import User model
import { ApiResponse } from "../utils/api-response.js"; // Utility for consistent API responses
import { ApiError } from "../utils/api-error.js"; // Custom API error handler
import { asyncHandler } from "../utils/async-handler.js"; // Async wrapper to catch errors in controllers
import { emailVerificationMail, sendEmail } from "../utils/mail.js"; // Email utilities

// Function to generate access and refresh tokens for a user
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId); // Find user by ID
    const accessToken = user.generateAccessToken(); // Generate JWT access token
    const refreshToken = user.generateRefreshToken(); // Generate JWT refresh token

    user.refreshToken = refreshToken; // Save refresh token in DB
    await user.save({ validateBeforeSave: false }); // Save user without running validation checks

    return { accessToken, refreshToken }; // Return tokens
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access Token.", // Custom error if token generation fails
    );
  }
};

// Controller: Register a new user
const registerUser = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body; // Extract data from request body

  // Check if user already exists (by email or username)
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User email or username already exists", []);
  }

  // Create new user (email not verified yet)
  const user = await User.create({
    username: username,
    email: email,
    password: password,
    isEmailVarified: false,
  });

  // Generate temporary verification token
  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemoporaryToken();

  // Save verification token + expiry in DB
  user.emailVarificationToken = hashedToken;
  user.emailVarificationExpiry = tokenExpiry;

  await user.save({ validateBeforeSave: false }); // Save without validation

  // Send verification email with link
  await sendEmail({
    email: user?.email, // recipient
    subject: "Please verify you email.",
    mailgenContent: emailVerificationMail(
      user.username,
      `${req.protocol}://${req.get("host")}/api/va/users/verify-email/${unHashedToken}`, // Verification link with unhashed token
    ),
  });

  // Fetch created user but hide sensitive fields
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVarificationToken -emailVarificationExpiry",
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user.");
  }

  // Send success response
  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        { user: createdUser },
        "User registered successfully and verification email has been sent on your email.",
      ),
    );
});

export { registerUser }; // Export controller
```
