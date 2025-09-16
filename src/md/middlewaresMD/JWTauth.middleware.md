```js
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import jwt from "jsonwebtoken";

/**
 * ✅ Middleware: verifyJWT
 * - Protects routes by checking if request contains a valid JWT token
 * - Extracts token from either:
 *    1. cookies (req.cookies.accessToken)
 *    2. Authorization header (Bearer <token>)
 * - Verifies the token using ACCESS_TOKEN_SECRET
 * - Fetches the user from DB (excluding sensitive fields)
 * - Attaches the user object to req.user so controllers can access it
 * - If token is missing/invalid/expired, throws ApiError(401)
 */
export const verifyJWT = asyncHandler(async (req, res, next) => {
  // 🔹 1. Extract token from cookies or "Authorization" header
  const token =
    req.cookies?.accessToken || // from cookie
    req.header("Authorization")?.replace("Bearer ", ""); // from header

  // ❌ No token found
  if (!token) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    // 🔹 2. Verify token using secret key
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // 🔹 3. Find the user from DB using token's user id (_id)
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken -emailVarificationToken -emailVarificationExpiry",
    );

    // ❌ If user is not found (maybe deleted or token tampered)
    if (!user) {
      throw new ApiError(401, "Invalid access token!");
    }

    // 🔹 4. Attach user object to request so next middleware/controller can use it
    req.user = user;

    // ✅ 5. Move to the next middleware/controller
    next();
  } catch (error) {
    // ❌ If token verification fails (expired, invalid, or wrong secret)
    throw new ApiError(401, "Invalid access token!");
  }
});
```
