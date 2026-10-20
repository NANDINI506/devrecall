// Run with:  npm run seed
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const { seedSubjects } = require("./seed");

(async () => {
  await connectDB();
  await seedSubjects();
  await mongoose.disconnect();
  console.log("Done");
})();
