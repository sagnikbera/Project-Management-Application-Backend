import dotenv from "dotenv";

dotenv.config({
  path: "./.env",
});

let myUseName = process.env.name;

console.log("value :", myUseName);
