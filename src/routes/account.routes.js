import express from "express";
import { authMiddleware } from "../middlewares/auth.middlewares.js";
import {
  createAccount,
  getAllAccount,
} from "../controllers/account.controller.js";

const router = express.Router();

router.post("/create-account", authMiddleware, createAccount);
router.get("/get-accounts", authMiddleware, getAllAccount);

export default router;
