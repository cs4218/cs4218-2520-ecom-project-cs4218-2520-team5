// Ang Yi Jie, Ivan, A0259256U
// Assisted with AI
// Test-only routes for Playwright UI test setup.
// These endpoints are guarded against production use.

import express from "express";
import userModel from "../models/userModel.js";
import { hashPassword } from "../helpers/authHelper.js";
import JWT from "jsonwebtoken";

const router = express.Router();

// Guard: reject all requests in production
const devOnly = (_req, res, next) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ success: false, message: "Not found" });
  }
  next();
};

// POST /api/v1/test/setup-admin
// Upserts a test admin user (role=1) and returns a JWT token.
router.post("/setup-admin", devOnly, async (req, res) => {
  try {
    const {
      email = "ivan.playwright.admin@test.com",
      password = "Test@12345",
      name = "Ivan PW Admin",
    } = req.body;
    const hashed = await hashPassword(password);
    const user = await userModel.findOneAndUpdate(
      { email },
      {
        name,
        email,
        password: hashed,
        phone: "91234567",
        address: "123 Test St",
        answer: "soccer",
        role: 1,
      },
      { upsert: true, new: true }
    );
    const token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.json({ success: true, token, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/v1/test/setup-user
// Upserts a test regular user (role=0) and returns a JWT token.
router.post("/setup-user", devOnly, async (req, res) => {
  try {
    const {
      email = "ivan.playwright.user@test.com",
      password = "Test@12345",
      name = "Ivan PW User",
    } = req.body;
    const hashed = await hashPassword(password);
    const user = await userModel.findOneAndUpdate(
      { email },
      {
        name,
        email,
        password: hashed,
        phone: "91234567",
        address: "123 Test St",
        answer: "soccer",
        role: 0,
      },
      { upsert: true, new: true }
    );
    const token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.json({ success: true, token, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
