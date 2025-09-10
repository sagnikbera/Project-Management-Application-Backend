```js
import mongoose, { Schema } from "mongoose";

// Define the User schema
// Schema = structure/blueprint of how documents will be stored in MongoDB
const userSchema = new Schema(
  {
    // Avatar field (object with url and localPath)
    avatar: {
      type: {
        url: String,        // Public URL for profile picture
        localPath: String,  // File system path (if stored locally)
      },
      default: {
        url: `https://placehold.co/200x200`, // Default avatar if user doesn't upload one
        localPath: "",
      },
    },

    // Username (unique identifier apart from email)
    username: {
      type: String,
      required: true,  // Must be provided
      unique: true,    // No two users can have the same username
      lowercase: true, // Stored in lowercase for consistency
      trim: true,      // Removes spaces at start and end
      index: true,     // Makes searching faster
    },

    // Email field
    email: {
      type: String,
      required: true,  // Must be provided
      unique: true,    // No duplicate emails
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
      type: Date,   // Expiry time of reset token
    },

    // Email verification tokens
    emailVarificationToken: {
      type: String, // Token sent via email to verify account
    },
    emailVarificationExpiry: {
      type: Date,   // Expiry time for verification token
    },
  },
  {
    timestamps: true, // Auto-adds createdAt and updatedAt fields
  },
);

// Create the User model from the schema
// This is what you'll use in your app to interact with the "users" collection in MongoDB
const User = mongoose.model("User", userSchema);

// Export the model so it can be used in controllers/services
export { User };

```