| Feature              | Pre Hook                                               | Post Hook                          |
| -------------------- | ------------------------------------------------------ | ---------------------------------- |
| **Timing**           | Runs **before** the operation                          | Runs **after** the operation       |
| **Use Case**         | Data validation, modification (e.g., hashing password) | Logging, sending emails, analytics |
| **Access to `this`** | Refers to the document (for `save`)                    | Gets the `doc` after operation     |
| **Common Hooks**     | `pre("save")`, `pre("findOneAndUpdate")`               | `post("save")`, `post("remove")`   |

### </>

```js
import mongoose, { Schema } from "mongoose";

// Define the User schema
// Schema = structure/blueprint of how documents will be stored in MongoDB
const userSchema = new Schema(
  {
    // Avatar field (object with url and localPath)
    avatar: {
      type: {
        url: String, // Public URL for profile picture
        localPath: String, // File system path (if stored locally)
      },
      default: {
        url: `https://placehold.co/200x200`, // Default avatar if user doesn't upload one
        localPath: "",
      },
    },

    // Username (unique identifier apart from email)
    username: {
      type: String,
      required: true, // Must be provided
      unique: true, // No two users can have the same username
      lowercase: true, // Stored in lowercase for consistency
      trim: true, // Removes spaces at start and end
      index: true, // Makes searching faster
    },

    // Email field
    email: {
      type: String,
      required: true, // Must be provided
      unique: true, // No duplicate emails
      lowercase: true, // Stored in lowercase
      trim: true,
    },

    // Full name (optional, can be updated later)
    fullName: {
      type: String,
      trim: true,
    },

    // Password (hashed before saving)
    password: {
      type: String,
      required: [true, "Password is required!"], // Custom error message if missing
    },

    // Email verification status
    isEmailVarified: {
      type: Boolean,
      default: false, // User must verify email after registration
    },

    // Refresh token for JWT authentication
    refreshToken: {
      type: String,
    },

    // Password reset functionality
    forgotPasswordToken: {
      type: String, // Token sent to user’s email for password reset
    },
    forgotPasswordExpiry: {
      type: Date, // Expiry time of reset token
    },

    // Email verification tokens
    emailVarificationToken: {
      type: String, // Token sent via email to verify account
    },
    emailVarificationExpiry: {
      type: Date, // Expiry time for verification token
    },
  },
  {
    timestamps: true, // Auto-adds createdAt and updatedAt fields
  },
);

// Pre-save hook: runs before saving the user to DB
userSchema.pre("save", async function (next) {
  // If password is not modified, skip hashing
  if (!this.isModified("password")) return next();

  // Hash the password using bcrypt (salt rounds = 10)
  this.password = await bcrypt.hash(this.password, 10);

  // Move to the next middleware or save operation
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  // 'password' → plain text password entered by the user during login
  // 'this.password' → the hashed password stored in the database
  // bcrypt.compare() → compares the plain password with the hashed one and returns true/false
  return await bcrypt.compare(password, this.password);
};

// Add a custom instance method to the User schema called "generateAccessToken"
userSchema.methods.generateAccessToken = async function () {
  // Create a JWT (JSON Web Token) using jwt.sign()
  // Payload: includes user-specific data (_id, email, username)
  // Secret: ACCESS_TOKEN_SECRET (stored in .env for security)
  // Options: expiresIn → how long the token is valid (e.g., "15m", "1h")
  let token = jwt.sign(
    //payload
    {
      _id: this._id, // unique user id from MongoDB
      email: this.email, // user's email
      username: this.username, // username for quick access
    },
    //secret
    process.env.ACCESS_TOKEN_SECRET, // secret key used to sign the token
    //options
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }, // expiry time from .env
  );

  // Return the signed JWT token
  return token;
};

// Create the User model from the schema
// This is what you'll use in your app to interact with the "users" collection in MongoDB
const User = mongoose.model("User", userSchema);

// Export the model so it can be used in controllers/services
export { User };
```

## 🔹 What is userSchema.methods?

- In Mongoose, every schema has a special property called `.methods`.
- You can attach functions to this object.
- These functions will become instance methods, meaning they can be called on individual documents created from the schema.

```js
// Add a custom method to the schema
userSchema.methods.sayHello = function () {
  return `Hello, I am ${this.username}`;
};
```

- `userSchema.methods` → where we add document-level methods.
- `sayHello` → function name.

---

### Temp token

```js
// https://nodejs.org/api/crypto.html#crypto

// Add a custom instance method to the User schema called "generateTemoporaryToken"
// This method generates a short-lived, random token (often used for things like
// password reset, email verification, etc.)
userSchema.methods.generateTemoporaryToken = function () {
  // 1. Generate a random token (unhashed) using crypto
  //    - randomBytes(20) → creates 20 random bytes
  //    - toString("hex") → convert those bytes into a hexadecimal string
  //    Example: "9f3b0a8c6a1f4e..."
  const unHashedToken = crypto.randomBytes(20).toString("hex");

  // 2. Hash the random token using SHA-256
  //    - This makes sure the token we save in the database is secure
  //    - We will compare this hashed token later when the user provides it
  const hashedToken = crypto
    .createHash("sha256") // choose SHA-256 hashing algorithm
    .update(unHashedToken) // hash the unHashed token
    .digest("hex"); // output in hex format

  // 3. Define an expiry time for this token
  //    - Date.now() → current timestamp in milliseconds
  //    - 20 * 60 * 1000 → 20 minutes in milliseconds
  //    - So the token will expire 20 minutes from now
  const tokenExpiry = Date.now() + 20 * 60 * 1000;

  // 4. Return all three:
  //    - unHashedToken → send to user via email (they use this to verify)
  //    - hashedToken → save in database (so we can validate later)
  //    - tokenExpiry → save in database to check if still valid
  return { unHashedToken, hashedToken, tokenExpiry };
};
```

### createHmac vs createHash

```js
import crypto from "crypto";

const hash = crypto
  .createHash("sha256") // choose algorithm
  .update("hello world") // input data
  .digest("hex"); // output format

console.log("Hash:", hash);
// Hash: b94d27b9934d3e08a52e52d7da7dabfa... (fixed for same input)
```

```js
import crypto from "crypto";

const secret = "my-secret-key";

const hmac = crypto
  .createHmac("sha256", secret) // algorithm + secret key
  .update("hello world") // input data
  .digest("hex"); // output format

console.log("HMAC:", hmac);
// Different from normal hash, and changes if secret changes
```

---

---

---
