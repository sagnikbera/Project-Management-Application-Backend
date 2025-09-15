### import

```js
import { User } from "../models/user.models.js"; // Import User model
import { ApiResponse } from "../utils/api-response.js"; // Utility for consistent API responses
import { ApiError } from "../utils/api-error.js"; // Custom API error handler
import { asyncHandler } from "../utils/async-handler.js"; // Async wrapper to catch errors in controllers
import { emailVerificationMail, sendEmail } from "../utils/mail.js"; // Email utilities
```

---

### Generate Access & Refresh Token

```js
// Utility function: Generate Access & Refresh Token
const generateAccessAndRefreshToken = async (userId) => {
  try {
    // 🔍 1. Find the user in the database using their ID
    const user = await User.findById(userId);

    // ⚡ 2. Generate a new access token (short-lived, e.g., 15m – 1h)
    const accessToken = user.generateAccessToken();

    // 🔑 3. Generate a new refresh token (long-lived, e.g., 7d – 30d)
    const refreshToken = user.generateRefreshToken();

    // 📝 4. Save the refresh token in the database against the user
    //    - This ensures we can later validate refresh tokens
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    // (skip validation so password/email checks don't run unnecessarily)

    // ✅ 5. Return both tokens to the calling function (usually login or refresh)
    return { accessToken, refreshToken };
  } catch (error) {
    // ❌ If something goes wrong (DB issue, token gen failure), throw server error
    throw new ApiError(
      500,
      "Something went wrong while generating access Token.",
    );
  }
};
```

---

### Register User

```js
// Controller: Register User
const registerUser = asyncHandler(async (req, res) => {
  // 1️⃣ Extract required fields from request body
  const { email, username, password, role } = req.body;

  // 2️⃣ Check if a user already exists with same email OR username
  const existedUser = await User.findOne({
    $or: [{ username }, { email }], // search by either username or email
  });

  if (existedUser) {
    // If user found → return conflict error
    throw new ApiError(409, "User email or username already exists", []);
  }

  // 3️⃣ Create a new user in DB
  const user = await User.create({
    username: username,
    email: email,
    password: password, // 🔒 Will be hashed in pre-save hook
    isEmailVarified: false, // default: unverified until user clicks verification mail
  });

  // 4️⃣ Generate a temporary token for email verification
  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemoporaryToken();

  // Save the hashed token & expiry in DB
  user.emailVarificationToken = hashedToken;
  user.emailVarificationExpiry = tokenExpiry;

  // Save user again without running validations
  await user.save({ validateBeforeSave: false });

  // 5️⃣ Send verification email with unHashedToken (raw token) in link
  await sendEmail({
    email: user?.email,
    subject: "Please verify you email.",
    mailgenContent: emailVerificationMail(
      user.username,
      // Example: http://localhost:5000/api/va/users/verify-email/123abc
      `${req.protocol}://${req.get("host")}/api/va/users/verify-email/${unHashedToken}`,
    ),
  });

  // 6️⃣ Fetch the created user but exclude sensitive fields
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVarificationToken -emailVarificationExpiry",
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user.");
  }

  // 7️⃣ Return response with created user info
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
```

---

---

### Login

```js
const login = asyncHandler(async (req, res) => {
  // Extract credentials from request body
  const { email, password } = req.body;

  // Basic validation: require an email (you only accept email here, not username)
  // Throws a 400 Bad Request if missing.
  if (!email) {
    throw new ApiError(400, "Username or email is required !");
    // Suggestion: change message to "Email is required!" for clarity since you use email to login.
  }

  // Find user by email in the database
  const user = await User.findOne({ email });

  // If no user found -> invalid credentials (don't reveal too much info in prod)
  if (!user) {
    throw new ApiError(400, "User does not exists !");
    // Suggestion: consider returning a generic "Invalid credentials" to avoid email enumeration.
  }

  // Verify provided password against hashed password stored in DB.
  // isPasswordCorrect is your model method that uses bcrypt.compare, and it's async.
  const isPasswordValid = await user.isPasswordCorrect(password);

  // If password doesn't match -> invalid credentials
  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid credentials !");
  }

  // Generate access and refresh tokens and persist refreshToken to DB.
  // generateAccessAndRefreshToken fetches user, creates JWTs and saves the refresh token.
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );

  // Re-query the user but exclude sensitive fields before sending to client.
  // "-password -refreshToken -emailVarificationToken -emailVarificationExpiry"
  // ensures these fields are not present in the returned object.
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVarificationToken -emailVarificationExpiry",
  );

  // If for some reason the user cannot be fetched, throw server error
  if (!loggedInUser) {
    // Note: message says "registering" but this is login — consider updating the message.
    throw new ApiError(500, "Something went wrong while registering the user.");
  }

  // Cookie options for security:
  // - httpOnly: prevents JavaScript access (mitigates XSS stealing cookies)
  // - secure: cookie sent only over HTTPS
  const options = {
    httpOnly: true,
    secure: true,
    // You may also want to add sameSite: "lax" or "strict", and maxAge (in ms)
  };

  // Respond: set cookies and return JSON payload with user + tokens.
  // Note: returning accessToken/refreshToken in JSON exposes them to client JS;
  // you may omit them from JSON for web clients and rely on httpOnly cookies instead.
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged In Sucessfully",
      ),
    );
});
```

### logout

```js
const logout = asyncHandler(async (req, res) => {
  // Remove the refresh token stored in the database for the current user.
  // This makes any existing refresh tokens invalid for generating new access tokens.
  await User.findByIdAndUpdate(
    req.user?._id, // Current logged-in user's ID, injected by your auth middleware
    {
      $set: { refreshToken: "" }, // Clear the stored refresh token
    },
    { new: true }, // Ensures the updated user document would be returned (though unused here)
  );

  // Cookie security options — same as when setting them during login:
  // - httpOnly: true  → prevents client-side JS from accessing cookies
  // - secure: true    → ensures cookies are sent only over HTTPS
  const options = {
    httpOnly: true,
    secure: true,
    // Suggestion: add sameSite: "strict" or "lax" to mitigate CSRF
  };

  // Clear both accessToken and refreshToken cookies from the browser
  // and respond with a success message.
  return res
    .status(200)
    .clearCookie("accessToken", options) // removes accessToken cookie
    .clearCookie("refreshToken", options) // removes refreshToken cookie
    .json(new ApiResponse(200, {}, "User Logged Out!"));
});
```

---

### getCurrentUser

```js
// Controller: Get Current User
const getCurrentUser = asyncHandler(async (req, res) => {
  // `req.user` is expected to be populated by your authentication middleware.
  // Usually, this happens after verifying a JWT (access token) and decoding the user’s ID.
  // Middleware finds the user in DB and attaches it to `req.user`.

  return res
    .status(200) // Send HTTP 200 OK response
    .json(
      new ApiResponse(
        200, // Custom status code (same as HTTP here, but consistent with ApiResponse structure)
        req.user, // Send back the current user object
        "Current user fetched successfully.", // Friendly message
      ),
    );
});
```

---

### Verify Email

```js
// Controller: Verify User Email
const verifyEmail = asyncHandler(async (req, res) => {
  // Extract the token sent in the request URL parameters
  const { verificationToken } = req.params;

  // If no token is provided in the request, throw an error
  if (!verificationToken) {
    throw new ApiError(400, "Email verification token is missing!");
  }

  // Convert the plain token into a hashed token
  // We hash it because in DB we store the hashed version for security
  let hashedToken = crypto
    .createHash("sha256") // Using SHA-256 algorithm
    .update(verificationToken) // Hash the provided token
    .digest("hex"); // Convert to hexadecimal string

  // Try to find a user in DB with this hashed token
  // Also ensure the token has not expired
  const user = await User.findOne({
    emailVarificationToken: hashedToken,
    emailVarificationExpiry: { $gt: Date.now() }, // expiry time must be in the future
  });

  // If no matching user is found, token is invalid or expired
  if (!user) {
    throw new ApiError(400, "Token is invalid or expired!");
  }

  // Clear the verification fields since the email is now verified
  user.emailVarificationToken = undefined;
  user.emailVarificationExpiry = undefined;

  // Mark the email as verified
  user.isEmailVarified = true;

  // Save the user document without running validations
  // (because only verification fields are updated)
  await user.save({ validateBeforeSave: false });

  // Send success response back to client
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        isEmailVarified: true, // Let the client know verification succeeded
      },
      "Email is verified!", // Friendly message
    ),
  );
});
```

---

### Resent email verification

```js
// Controller: Resend Email Verification
const resendEmailVerification = asyncHandler(async (req, res) => {
  // 🔍 1. Find the logged-in user by their ID (comes from req.user after JWT verification)
  const user = await User.findById(req.user?._id);

  // ❌ If user not found, throw 404 error
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // ⚡ If user is already verified, block the request (no need to send verification again)
  if (user.isEmailVarified) {
    throw new ApiError(409, "Email is already verified!");
  }

  // 🔑 2. Generate a new temporary email verification token
  // - unHashedToken → plain token (to be sent in email link)
  // - hashedToken   → secure hash stored in DB
  // - tokenExpiry   → expiry timestamp for token validity
  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemoporaryToken();

  // 📝 3. Save the hashed token and expiry in the database for this user
  user.emailVarificationToken = hashedToken;
  user.emailVarificationExpiry = tokenExpiry;

  await user.save({ validateBeforeSave: false }); // Skip field validations for speed

  // 📧 4. Send email containing the verification link
  await sendEmail({
    email: user?.email,
    subject: "Please verify your email.", // Subject line of the email
    mailgenContent: emailVerificationMail(
      user.username, // Personalize with username
      // Construct full verification URL (with unhashed token)
      `${req.protocol}://${req.get("host")}/api/va/users/verify-email/${unHashedToken}`,
    ),
  });

  // ✅ 5. Send back success response
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

### Reset forget password

```js
const resetForgotPassword = asyncHandler(async (req, res) => {
  // Extract reset token from the URL params (sent via email link)
  const { resetToken } = req.params;

  // Extract the new password from request body
  const { newPassword } = req.body;

  // Hash the resetToken using sha256 (because we stored only hashed version in DB)
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Search for a user with matching hashed token and a non-expired expiry time
  const user = await User.findOne({
    forgotPasswordToken: hashedToken,
    forgotPasswordExpiry: { $gt: Date.now() }, // must not be expired
  });

  // If no user found → token is invalid or expired
  if (!user) {
    throw new ApiError(404, "Token is invalid or expired!");
  }

  // Clear the reset token and expiry after successful verification
  // This ensures the token cannot be reused (one-time usage).
  user.forgotPasswordExpiry = undefined;
  user.forgotPasswordToken = undefined;

  // Assign the new password
  // NOTE: The userSchema has a pre("save") hook that automatically hashes
  // password if modified, but here you're calling save with `validateBeforeSave:false`.
  // That may skip validations, but the pre-save hashing will still run.
  user.password = newPassword;

  user.refreshToken = ""; // invalidate old sessions

  // Save updated user (with new password & cleared reset fields)
  await user.save({ validateBeforeSave: false });

  // Send success response
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset successfully!"));
});
```

---

### Change password

```js
const changeCurrentPassword = asyncHandler(async (req, res) => {
  // Extract old and new passwords from the request body
  const { oldPassword, newPassword } = req.body;

  // Find the currently logged-in user using the ID from req.user (set by auth middleware)
  const user = await User.findById(req.user?._id);

  // Check if the provided old password matches the one stored in DB
  // isPasswordCorrect() is a custom method from your User schema (uses bcrypt.compare)
  const isPasswordValid = await user.isPasswordCorrect(oldPassword);

  // If old password is incorrect, throw error
  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid old password!");
  }

  // If old password is correct, set the new password
  user.password = newPassword;

  user.refreshToken = ""; // invalidate old sessions

  // Save user with new password
  // Note: `validateBeforeSave: false` skips schema validation,
  // but your pre("save") hook will still hash the password properly
  await user.save({ validateBeforeSave: false });

  // Return success response
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully!"));
});
```

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
