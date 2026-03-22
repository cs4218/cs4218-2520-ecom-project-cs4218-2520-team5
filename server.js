// MS2 — server entry: DB connect + listen on exported app
// Written by: Ong Xin Hui Lynnette, A0257058X
// Assisted by AI

import colors from "colors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import app from "./app.js";

dotenv.config();
connectDB();

const PORT = process.env.PORT || 6060;

app.listen(PORT, () => {
  console.log(
    `Server running on ${process.env.DEV_MODE} mode on ${PORT}`.bgCyan.white,
  );
});
