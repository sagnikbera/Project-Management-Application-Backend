```js
// Import the Mongoose library to interact with MongoDB
import mongoose from "mongoose";

// Create an asynchronous function to connect to the MongoDB database
const connectDB = async () => {
  try {
    // Use mongoose.connect to establish a connection to the database
    // The connection string is taken from environment variables for security
    await mongoose.connect(process.env.MONGO_URI);

    // If the connection is successful, log a success message
    console.log("MongoDB connected!");
  } catch (error) {
    // If there is an error during connection, log the error
    console.error("MongoDB connection ERROR", error);

    // Exit the process with a failure code (1) to indicate something went wrong
    process.exit(1);
  }
};

// Export the connectDB function so it can be imported and used in other files
export default connectDB;
```
