import express from "express";
import { authMiddleware } from "../middlewares/auth.middlewares.js";
import {
  deposit,
  transaferBalance,
  withdraw,
} from "../controllers/transaction.controller.js";

const router = express.Router();

//* Internal balance deposit withdraw apis
router.post("/deposit", authMiddleware, deposit);
router.post("/withdraw", authMiddleware, withdraw);

//* Transfer balance api
router.post("/transfer", authMiddleware, transaferBalance);

export default router;
