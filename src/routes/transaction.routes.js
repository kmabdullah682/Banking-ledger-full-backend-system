import express from "express";
import { authMiddleware } from "../middlewares/auth.middlewares.js";
import { deposit, withdraw } from "../controllers/transaction.controller.js";

const router = express.Router();

router.post("/deposit", authMiddleware, deposit);
router.post("/withdraw", authMiddleware, withdraw);

export default router;
