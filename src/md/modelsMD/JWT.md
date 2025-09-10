# 🔑 Access Token vs Refresh Token (with JWT in Node.js + Mongoose)

---

## 🔹 1. What is an **Access Token**?

- A **short-lived** token (usually 5–15 minutes).
- Contains **user identity & permissions** (encoded in JWT).
- Sent with every request to protected routes (in the `Authorization` header).
- If stolen → damage is limited because it expires quickly.

**Example Payload:**

```json
{
  "userId": "64fe2c...",
  "role": "admin",
  "iat": 1694303022,
  "exp": 1694303922
}
```

## 🔹 2. What is a **Refresh Token**?

- A **long-lived** token (days, weeks, or months).
- Used **only to get a new Access Token** when it expires.
- Stored securely (often in **HTTP-only cookies**).
- Not sent with every request (only to `/refresh` endpoint).
- If compromised → attacker can keep generating tokens until it’s revoked.

---

## 🔹 3. How They Work Together

1. User logs in → server issues:
   - **Access Token** (short expiry)
   - **Refresh Token** (long expiry, stored in DB or Redis)

2. Access Token is sent in headers for API requests:
   ```http
   Authorization: Bearer <access_token>
   ```
3. When Access Token expires → client sends Refresh Token to /refresh endpoint.
4. Server verifies Refresh Token → issues a new Access Token.

## 🔹 Example Implementation (Node.js + JWT)

### Generate Tokens (Schema Methods)

```js
import jwt from "jsonwebtoken";

// Instance method → generate access token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }, // short expiry
  );
};

// Instance method → generate refresh token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { id: this._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }, // long expiry
  );
};
```

### Usage in Login Controller

```js
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");

  const isValid = await user.isPasswordCorrect(password);
  if (!isValid) throw new Error("Invalid credentials");

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // Save refresh token in DB (optional, for invalidation later)
  user.refreshToken = refreshToken;
  await user.save();

  // Send tokens to client
  res.json({ accessToken, refreshToken });
});
```

### Refresh Endpoint

```js
const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) throw new Error("Refresh token required");

  const user = await User.findOne({ refreshToken });
  if (!user) throw new Error("Invalid refresh token");

  // Verify token
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

  // Generate new access token
  const newAccessToken = user.generateAccessToken();

  res.json({ accessToken: newAccessToken });
});
```

##

- **Access Token** → short-lived, used in headers, protects APIs.
- **Refresh Token** → long-lived, stored securely, used only to re-issue access tokens.
- Both together improve **security** + **user experience** (no constant logins).
