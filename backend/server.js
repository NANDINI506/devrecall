// Entry point: loads env, connects to MongoDB, seeds starter content, starts the server.
require("dotenv").config();

if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET is missing. Copy .env.example to .env and set it.");
  process.exit(1);
}

const app = require("./src/app");
const connectDB = require("./src/config/db");
const { seedSubjects } = require("./src/seed/seed");

const PORT = process.env.PORT || 5000;

(async () => {
  await connectDB();
  await seedSubjects(); // only adds starter subjects that don't exist yet
  app.listen(PORT, () => console.log(`🚀 DevRecall API running on http://localhost:${PORT}`));
})();
