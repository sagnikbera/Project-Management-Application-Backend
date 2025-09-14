```js
import { User } from "../models/user.models.js"; // Import User model to fetch user details from DB
import { ApiError } from "../utils/api-error.js"; // Custom error class for handling API errors
import { asyncHandler } from "../utils/async-handler.js"; // Async wrapper to handle errors in middleware
import jwt from "jsonwebtoken"; // Library for verifying JWT tokens

// Middleware to verify JWT and authenticate user
export const verifyJWT = asyncHandler(async (req, res, next) => {
  // Try to get token from cookies OR from Authorization header
  const token =
    req.cookies?.accessToken || // Token from cookies
    req.header("Authorization")?.replace("Beared ", ""); // Token from "Authorization" header (typo: should be "Bearer ")

  // If token is missing → unauthorized
  if (!token) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    // Verify the token with the secret key
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Find user based on decoded user ID and exclude sensitive fields
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken -emailVarificationToken -emailVarificationExpiry",
    );

    // If no user found → invalid token
    if (!user) {
      throw new ApiError(401, "Invalid access token!");
    }

    // Attach user info to `req.user` so next middleware/routes can access it
    req.user = user;

    // Move to the next middleware/route handler
    next();
  } catch (error) {
    // If verification fails → throw unauthorized error
    throw new ApiError(401, "Invalid access token!");
  }
});
```
