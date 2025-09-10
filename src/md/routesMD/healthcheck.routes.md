```js
import { Router } from "express";
import { healthCheck } from "../controllers/healthcheck.controller.js";

// Create a new router instance.
// Routers let us organize related routes in separate files instead of app.js.
const router = Router();

// Define a GET route at "/" (relative to "/api/v1/healthcheck").
// So the full path becomes: GET /api/v1/healthcheck/
// When this endpoint is hit, it calls the "healthCheck" controller function.
router.route("/").get(healthCheck);

// Export the router as default so it can be imported in app.js.
export default router;
```
