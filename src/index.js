import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});
import app from "./app.js";
import connectDB from "./db/connectDB.js";

const port = process.env.PORT || 3000;

// app.listen(port, () => {
//   console.log(`App Listening on port http://localhost:${port}`);
// });

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`App Listening on port http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error!", err);
    process.exit(1);
  });
