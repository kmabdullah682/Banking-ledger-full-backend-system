import "dotenv/config";
import app from "./src/app.js";
import connectDB from "./src/db/db.js";

const PORT = 3000;

connectDB();

app.listen(PORT, () => {
  console.log(`App is running on port: ${PORT}`);
});
