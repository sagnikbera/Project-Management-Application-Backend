```js
class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    // HTTP status code (e.g., 200, 201, 404, 500)
    this.statusCode = statusCode;

    // The actual data (payload) you want to send back to the client
    this.data = data;

    // A human-readable message (default: "Success")
    this.message = message;

    // Boolean flag to quickly check if the response is success or error
    // ✅ true if statusCode < 400 (i.e., 2xx or 3xx)
    // ❌ false if statusCode >= 400 (i.e., client or server error)
    this.success = statusCode < 400;
  }
}

// Export the class so it can be used in other files (e.g., controllers, routes)
export { ApiResponse };
```

### Example Usage:

```js
import { ApiResponse } from "./api-response.js";

// ✅ Success response
const res1 = new ApiResponse(200, { id: 1, name: "Alice" });
console.log(res1);
/*
{
  statusCode: 200,
  data: { id: 1, name: "Alice" },
  message: "Success",
  success: true
}
*/

// ❌ Error response
const res2 = new ApiResponse(404, null, "User not found");
console.log(res2);
/*
{
  statusCode: 404,
  data: null,
  message: "User not found",
  success: false
}
*/
```

# 📌 Why is the `constructor` made in ApiResponse?

The **constructor** in the `ApiResponse` class is used to **automatically build a consistent response object** every time you create a new API response.

---

## 🔹 Problem without constructor

Normally, in Express you might write:

```js
res.json({ statusCode: 200, data: user, message: "Success", success: true });
res.json({
  statusCode: 404,
  data: null,
  message: "User not found",
  success: false,
});
```

## ⚠️ Issues

- **Repetition** → the same response structure has to be written everywhere.
- **Risk of typos** → easy to make mistakes or miss a field.
- **Inconsistent formats** → different routes may return slightly different JSON.
- **Harder to maintain** → changing response format requires updating multiple files.

## 🔹 How constructor helps

```js
new ApiResponse(200, user);
// 👆 Creates { statusCode: 200, data: user, message: "Success", success: true }

new ApiResponse(404, null, "User not found");
// 👆 Creates { statusCode: 404, data: null, message: "User not found", success: false }
```

## 🔹 Benefits

1. **Reusability** → one class works for all responses.
2. **Consistency** → all responses follow the same structure.
3. **Less code** → no need to repeat boilerplate JSON.
4. **Flexibility** → you can add fields (like `timestamp`, `requestId`, etc.) in one place and it applies everywhere.
