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

---

---

### Login

```js
// Controller: Login existing user
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body; // Extract email & password from request body

  // ✅ 1. Check if email is provided
  if (!email) {
    throw new ApiError(400, "Username or email is required !");
  }

  // ✅ 2. Find user by email
  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(400, "User does not exists !");
  }

  // ✅ 3. Validate password using model method
  // (compare entered password with hashed password in DB)
  const isPasswordValid = user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid credentials !");
  }

  // ✅ 4. Generate Access + Refresh Tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );

  // ✅ 5. Fetch logged in user (without sensitive fields)
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVarificationToken -emailVarificationExpiry",
  );

  if (!loggedInUser) {
    throw new ApiError(500, "Something went wrong while registering the user.");
  }

  // ✅ 6. Cookie options for security
  const options = {
    httpOnly: true, // Prevent client-side JS from accessing cookies
    secure: true, // Cookie will only be sent over HTTPS
  };

  // ✅ 7. Send response → set cookies + return API response
  return res
    .status(200)
    .cookie("accessToken", accessToken, options) // Store accessToken in cookie
    .cookie("refreshToken", refreshToken, options) // Store refreshToken in cookie
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser, // Return user details (safe version)
          accessToken, // Also send tokens in response body
          refreshToken,
        },
        "User Logged In Sucessfully", // Success message
      ),
    );
});
```

### logout

```js
// Controller to log out the user
const logout = asyncHandler(async (req, res) => {
  // 1. Remove (invalidate) the refresh token stored in DB for this user
  await User.findByIdAndUpdate(
    req.user_id, // <-- BUG: should be `req.user._id` (from verifyJWT middleware)
    {
      $set: {
        refreshToken: "", // Clear stored refresh token
      },
    },
    {
      new: true, // Return updated document (not used here, but good practice)
    },
  );

  // 2. Cookie options (must match how cookies were originally set)
  const options = {
    httpOnly: true, // Make cookies inaccessible from client-side JS
    secure: true, // Cookies only sent over HTTPS
  };

  // 3. Clear authentication cookies and send success response
  return res
    .status(200)
    .clearCookie("accessToken", options) // Remove access token cookie
    .clearCookie("refreshToken", options) // Remove refresh token cookie
    .json(
      new ApiResponse(200, {}, "User Logged Out!"), // Send success message
    );
});
```

---

---

# 🍪 Cookie Options in Express (`res.cookie`)

## Available Options

| Option         | Type           | Default              | Description                                                                                 |
| -------------- | -------------- | -------------------- | ------------------------------------------------------------------------------------------- |
| **`maxAge`**   | Number (ms)    | `null`               | How long the cookie lasts in milliseconds (auto-expires after that).                        |
| **`expires`**  | Date           | `null`               | Specific date when the cookie should expire. Overrides `maxAge` if present.                 |
| **`httpOnly`** | Boolean        | `false`              | If `true`, cookie **cannot** be accessed by JS (`document.cookie`) → safer against **XSS**. |
| **`secure`**   | Boolean        | `false`              | If `true`, cookie is sent **only over HTTPS**.                                              |
| **`sameSite`** | String/Boolean | `false`              | Controls cross-site cookie behavior: `"strict"`, `"lax"`, or `"none"`.                      |
| **`path`**     | String         | `'/'`                | URL path the cookie belongs to (default root).                                              |
| **`domain`**   | String         | Current domain       | Specifies which domain can access the cookie.                                               |
| **`signed`**   | Boolean        | `false`              | If `true`, signs the cookie with `cookie-parser` secret to prevent tampering.               |
| **`priority`** | String         | `null`               | (Chrome only) `"low"`, `"medium"`, `"high"`. Controls eviction priority.                    |
| **`encode`**   | Function       | `encodeURIComponent` | Custom encoding function for the cookie value.                                              |

---

## ✅ Example: Using All Options

```js
res.cookie("accessToken", accessToken, {
  maxAge: 15 * 60 * 1000, // 15 minutes
  expires: new Date(Date.now() + 15 * 60 * 1000), // exact expiry
  httpOnly: true, // not accessible via JS
  secure: true, // HTTPS only
  sameSite: "strict", // protect against CSRF
  path: "/", // available site-wide
  domain: "example.com", // only for this domain
  signed: false, // not signed
});
```
