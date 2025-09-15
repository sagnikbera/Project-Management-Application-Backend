### basic

```js
import { ApiResponse } from "../utils/api-response.js";

// Controller function for the health check endpoint
// This will be mapped to something like GET /api/v1/healthcheck
const healthCheck = (req, res) => {
  try {
    // If everything is fine, send a 200 OK response
    // `ApiResponse` is used to send a consistent JSON format
    // statusCode = 200
    // data = { message: "Server is running..." }
    // message defaults to "Success"
    res
      .status(200)
      .json(new ApiResponse(200, { message: "Server is running..." }));
  } catch (error) {
    // next(error) passes the error to Express’s central error-handling middleware.
    // That middleware is where you define how all errors should be handled consistently (status code, message, stack trace, etc.).
    next(error);
  }
};

export { healthCheck };
```

### after modification

- **Wrapper around function**

### coming from /utils/async-handler.js

```js
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

// healthCheck is wrapped with asyncHandler.
// This means if anything inside throws an error (e.g. DB not reachable),
// it will automatically be caught and sent to Express's error middleware via next(err).

const healthCheck = asyncHandler(async (req, res) => {
  // Send a standardized response using ApiResponse
  res
    .status(200)
    .json(new ApiResponse(200, { message: "Server is running..." }));
});

export { healthCheck };
```

- **After (with asyncHandler)** - _I simply wrap the controller with asyncHandler and forget about try/catch.
  Any error is automatically passed to next(error)._
- `next(error)` passes the error to Express’s central error-handling middleware.

### get

```js
PORT=8000
CORS_ORIGIN=*
#("https://example.com,https://another.com")  <-- CORES_ORIGIN
MONGO_URI=mongodb+srv://admin:admin@cluster0.e9ls9jj.mongodb.net/projectmanagement

ACCESS_TOKEN_SECRET = sagniksproject
ACCESS_TOKEN_EXPIRY=1d

REFRESH_TOKEN_SECRET = sanisproject
REFRESH_TOKEN_EXPIRY=10d

MAILTRAP_SMTP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_SMTP_PORT=2525
MAILTRAP_SMTP_USER=3157d9a28342e5
MAILTRAP_SMTP_PASS=4fbf9ef00fd2b5

FORGOT_PASSWORD_REDIRECT_URL = http://localhost:3000/forgot-password
```
