// MS2 — Express app extraction for Supertest integration
// Written by: Ong Xin Hui Lynnette, A0257058X
// Assisted by AI

import express from "express";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./routes/authRoute.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import testRoutes from "./routes/testRoutes.js";

/**
 * Express application instance (no listen, no DB connect).
 * Used by server.js for production and by Supertest integration tests.
 */
const app = express();

app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/test", testRoutes);

app.get("/", (req, res) => {
  res.send("<h1>Welcome to ecommerce app</h1>");
});

export default app;
