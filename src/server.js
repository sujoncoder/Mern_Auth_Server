import app from "./app.js";

import { PORT } from "./config/constants.js";
import connectDB from "./config/db.js"

app.listen(PORT, async () => {
    console.log(`Server is running on localhost:${PORT}`)
    await connectDB()
});