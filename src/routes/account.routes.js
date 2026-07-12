import express from "express";
import { authMiddleware } from "../middlewares/auth.middlewares.js";
import {
  createAccount,
  getAllAccount,
  statement,
  verifyBalance,
} from "../controllers/account.controller.js";

const router = express.Router();

router.post("/create-account", authMiddleware, createAccount);
router.get("/get-accounts", authMiddleware, getAllAccount);
router.get("/:accountNumber/verify", authMiddleware, verifyBalance);
router.get("/:accountNumber/statement", authMiddleware, statement);

export default router;
