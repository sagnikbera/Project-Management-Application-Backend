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

### getCurrentUser

```js
// Controller to get the currently authenticated user
const getCurrentUser = asyncHandler(async (req, res) => {
  // If authentication middleware (like verifyJWT) is used,
  // it usually attaches the logged-in user's info into req.user

  return res
    .status(200) // HTTP status 200 = OK
    .json(
      new ApiResponse(
        200, // custom response status
        req.user, // the user object already attached to request
        "Current user fetched successfully.", // success message
      ),
    );
});
```

---

### Verify Email

```js
const verifyEmail = asyncHandler(async (req, res) => {
  // Extract verification token from URL params
  const { verificationToken } = req.params;

  // If no token provided, throw error
  if (!verificationToken) {
    throw new ApiError(400, "Email verification token is missing!");
  }

  // Hash the received token so it matches the one stored in DB
  let hashedToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  // Find a user with matching hashed token and token not expired
  const user = await User.findOne({
    emailVarificationToken: hashedToken,
    emailVarificationExpiry: { $gt: Date.now() }, // expiry must be in the future
  });

  // If no user found → invalid or expired token
  if (!user) {
    throw new ApiError(400, "Token is invalid or expired!");
  }

  // Clear verification token and expiry from user document
  user.emailVarificationToken = undefined;
  user.emailVarificationExpiry = undefined;

  // Mark email as verified
  user.isEmailVarified = true;

  // Save changes to DB without running validation rules
  await user.save({ validateBeforeSave: false });

  // Respond with success
  return res.status(200).json(
    new ApiResponse(
      200,
      { isEmailVarified: true }, // return status of verification
      "Email is verified!",
    ),
  );
});
```

---

### Resent email verification

```js
const resendEmailVerification = asyncHandler(async (req, res) => {
  // Find the currently logged-in user by ID (req.user is set by auth middleware)
  const user = await User.findById(req.user?._id);

  // If user not found → throw error
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // If email already verified → no need to resend verification
  if (user.isEmailVarified) {
    throw new ApiError(409, "Email is already verified!");
  }

  // Generate a new temporary token for email verification
  // This function returns:
  //   - unHashedToken → plain token (to send in email link)
  //   - hashedToken   → hashed version (stored in DB for security)
  //   - tokenExpiry   → expiry time (e.g., 10 minutes)
  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemoporaryToken();

  // Save hashed token and expiry in DB
  user.emailVarificationToken = hashedToken;
  user.emailVarificationExpiry = tokenExpiry;

  // Save user without running schema validation again
  await user.save({ validateBeforeSave: false });

  // Send verification email to user
  // The email contains a clickable link with the plain (unhashed) token
  await sendEmail({
    email: user?.email,
    subject: "Please verify you email.",
    mailgenContent: emailVerificationMail(
      user.username,
      `${req.protocol}://${req.get("host")}/api/va/users/verify-email/${unHashedToken}`,
    ),
  });

  // Return success response
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Mail has been sent to your email."));
});
```

---

### Refresh access token

```js
//! Refresh access token
const refreshAccessToken = asyncHandler(async (req, res) => {
  // Step 1: Get the incoming refresh token
  // It can come either from cookies (preferred way for security)
  // or from the request body (fallback, less secure).
  // NOTE: In Express with cookie-parser, it should be `req.cookies.refreshToken`,
  // not `req.cookie.refreshToken`.
  const incommingRefreshToken =
    req.cookie.refreshToken || req.body.refreshToken;

  // Step 2: If no refresh token was provided → deny access
  if (!incommingRefreshToken) {
    throw new ApiError(401, "Unauthorized access!");
  }

  try {
    // Step 3: Verify the refresh token
    // jwt.verify will decode and check if the token is valid and not expired
    // using REFRESH_TOKEN_SECRET.
    const decodedToken = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    // Step 4: Find the user from DB using the id embedded in the token
    const user = await User.findById(decodedToken?._id);

    // If user not found (maybe deleted), the token is invalid
    if (!user) {
      throw new ApiError(404, "Invalid refresh token");
    }

    // Step 5: Match the provided refresh token with the one saved in DB
    // This prevents reuse of old/stolen tokens after user logout or token rotation.
    if (incommingRefreshToken !== user?.refreshToken) {
      throw new ApiError(404, "Invalid refresh token");
    }

    // Step 6: Define cookie options
    // - httpOnly: JS on client side cannot access the cookie (XSS protection)
    // - secure: cookie only sent on HTTPS (prevents MITM attacks)
    const options = {
      httpOnly: true,
      secure: true,
    };

    // Step 7: Generate new access and refresh tokens
    // generateAccessAndRefreshToken handles:
    //   - creating JWT accessToken and refreshToken
    //   - saving refreshToken to the DB
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    // Step 8: (Optional redundancy)
    // Save the newly generated refreshToken to the user’s record.
    // This is technically already handled inside generateAccessAndRefreshToken,
    // but ensures DB has the latest token.
    user.refreshToken = newRefreshToken;
    await user.save();

    // Step 9: Send back the new tokens
    //   - Set them as secure cookies
    //   - Also return them in JSON response (optional, but useful for mobile apps)
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token refreshed!",
        ),
      );
  } catch (error) {
    // Step 10: If jwt.verify failed (expired or tampered token), return error
    // For better debugging, you could check `error.name === "TokenExpiredError"`
    throw new ApiError(401, "Refresh token is expired!");
  }
});
```

---

### Forgot Password

```js
//! Forgot Password
const forgotPasswordRequest = asyncHandler(async (req, res) => {
  // Extract email from the request body (client should POST { email })
  const { email } = req.body;

  // Look up user by email in the database
  const user = await User.findOne({ email });

  // If user doesn't exist, throw a 404 error.
  // NOTE: for better security (to avoid email enumeration) you may want to
  // return a generic 200 response instead of revealing that the user doesn't exist.
  if (!user) {
    throw new ApiError(404, "User does not exists!", []);
  }

  // Generate a temporary token for password reset.
  // generateTemoporaryToken() returns:
  //  - unHashedToken: the plain token (safe to send via email to the user)
  //  - hashedToken: a hashed version (sha256) to store in DB so we don't store the plain token
  //  - tokenExpiry: timestamp (Date.now() + some milliseconds) representing expiry time
  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemoporaryToken();

  // Save the hashed token and expiry on the user document so we can verify later.
  // The fields are named forgotPasswordToken and forgotPasswordExpiry.
  user.forgotPasswordToken = hashedToken;
  user.forgotPasswordExpiry = tokenExpiry;

  // Persist the changes to the DB.
  // validateBeforeSave: false disables schema validators on this save,
  // which is common when only updating token fields and you don't want full validation to run.
  await user.save({ validateBeforeSave: false });

  // Send password reset email to the user.
  // The email includes the unHashedToken in the reset URL so the user can click it.
  // mailgenContent is built by forgotPasswordMail(...) (Mailgen + nodemailer used in your utils).
  await sendEmail({
    email: user?.email, // recipient
    subject: "Password Reset Request", // email subject
    mailgenContent: forgotPasswordMail(
      user.username,
      // Redirect link that user will use to reset password (frontend route typically).
      // FORGOT_PASSWORD_REDIRECT_URL should be set in env (e.g., https://app.example.com/reset-password)
      `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unHashedToken}`,
    ),
  });

  // Return success response.
  // NOTE: current message has a small typo ("yoru") in your original code; fixed below.
  return res
    .status(200)
    .json(
      new ApiResponse(200, {}, "Password reset mail is sent to your email."),
    );
});
```

---

---

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
