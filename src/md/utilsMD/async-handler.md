```js
// asyncHandler is a higher-order function (a function that returns another function).
// It takes a request handler (controller) as input and wraps it inside a try/catch using Promise.resolve().
//
// Why?
// In Express, if an async controller throws an error or rejects a promise,
// Express does not automatically catch it. That would crash the app unless
// you manually wrap every controller in try/catch. This utility saves you from that.
//
// It ensures any rejected promise (error in async function) is passed to next(err),
// which then goes to the centralized error-handling middleware.

const asyncHandler = (reqHandler) => {
  return (req, res, next) => {
    Promise.resolve(reqHandler(req, res, next)) // Call the actual controller
      .catch((err) => next(err)); // Forward error to Express error middleware
  };
};

export { asyncHandler };
```
