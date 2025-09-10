## BASIC CONFIGURATION

```js
//? BASIC CONFIGURATION

// Middleware to parse incoming JSON payloads
app.use(express.json({ limit: "16kb" }));
// Middleware to parse URL-encoded form data (from HTML forms)
// `extended: true` → allows parsing nested objects (using qs library instead of querystring)
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
// Serves static files (images, CSS, JS, etc.) from the "public" folder
app.use(express.static("public"));
```

## CORS CONFIGURATION

```js
//? CORS CONFIGURATION
app.use(
  cors({
    // 👇 Allowed origins (which frontends can access your backend)
    // process.env.CORS_ORIGIN is read from .env file, supports multiple origins split by ","
    // Fallback = "https://localhost:5173" (e.g. your local React/Next app)
    origin: process.env.CORS_ORIGIN?.split(",") || "https://localhost:5173",

    // 👇 Allow cookies, authorization headers, etc. to be sent cross-origin
    credentials: true,

    // 👇 Restrict allowed HTTP methods
    // Only requests with these methods will be accepted from cross-origin
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTION"],

    // ✅ Headers allowed in requests from frontend
    allowedHeaders: [
      "Authorization", // 👈 Allows sending tokens (JWT, OAuth, Bearer token, etc.)
      "Content-Type", // 👈 Tells server the request body type (e.g. application/json, form-data)
    ],
  }),
);
```

### Routes
```js
// Importing the health check router from the routes folder.
// This router file defines how requests to "/api/v1/healthcheck" should be handled.
import healthCheckRouter from "./routes/healthcheck.routes.js"

// Mounting the healthCheckRouter on the path "/api/v1/healthcheck".
// This means: any request starting with "/api/v1/healthcheck" will be forwarded
// to the routes defined inside healthcheck.routes.js.
app.use("/api/v1/healthcheck", healthCheckRouter);
```

| Method      | Purpose                           | Example Request                                                         | Example Use Case                        |
| ----------- | --------------------------------- | ----------------------------------------------------------------------- | --------------------------------------- |
| **GET**     | Retrieve data                     | `GET /users`                                                            | Fetch a list of users                   |
| **POST**    | Create new data                   | `POST /users` with body `{ "name": "Alice" }`                           | Add a new user                          |
| **PUT**     | Replace a resource completely     | `PUT /users/123` with body `{ "name": "Bob", "email": "bob@mail.com" }` | Replace user 123 with new object        |
| **PATCH**   | Partially update a resource       | `PATCH /users/123` with body `{ "email": "bob@mail.com" }`              | Update only the email of user 123       |
| **DELETE**  | Remove a resource                 | `DELETE /users/123`                                                     | Delete user 123                         |
| **OPTIONS** | Preflight CORS check (by browser) | `OPTIONS /users` (auto by browser)                                      | Browser checks if POST/PUT/etc. allowed |
