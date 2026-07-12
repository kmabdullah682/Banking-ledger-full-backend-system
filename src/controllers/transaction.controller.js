import AccountModel from "../models/accounts.models.js";
import ledgerModel from "../models/ledger.models.js";
import mongoose from "mongoose";

const DAILY_SAVINGS_LIMIT = 5;
const DAILY_WITHDRAW_CASH_LIMIT = 10000;

const deposit = async (req, res) => {
  const { accountNumber, amount } = req.body;
  const numberedAmount = Number(amount);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!accountNumber || !amount) {
      return res.status(400).json({
        message:
          "please provide the important credential to deposit money in your account",
        success: false,
      });
    }

    const account = await AccountModel.findOne({ accountNumber }).session(
      session,
    );

    if (!account) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        message:
          "account not found or don't exist please place the correct A/C number or create on A/C if you don't have one",
        success: false,
      });
    }

    if (account.accountType === "savings") {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const depositCountToday = await ledgerModel
        .countDocuments({
          accountNumber,
          type: "credit",
          createdAt: { $gte: twentyFourHoursAgo },
        })
        .session(session);

      if (depositCountToday >= DAILY_SAVINGS_LIMIT) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          message: `Transaction rejected. Savings accounts are limited to ${DAILY_SAVINGS_LIMIT} deposits per 24 hours. Please wait until your window resets.`,
        });
      }
    }

    account.balance += numberedAmount;
    await account.save({ session });

    const createTransactionId = (prefix = "TXN") => {
      const timestamp = Date.now().toString(36);
      const randomStr = Math.random().toString(36).substring(2, 8);
      return `${prefix}-${timestamp}-${randomStr}`.toUpperCase();
    };

    const transactionId = createTransactionId();

    const ledgerEntry = new ledgerModel({
      transactionId,
      accountNumber,
      type: "credit",
      amount: numberedAmount,
      description: "Standard Deposit with Frequency Check",
    });

    await ledgerEntry.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "balance deposited successfully",
      success: true,
      balance: account.balance,
      accountNumber,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({
      message: "internal server error" + error,
      success: false,
    });
  }
};

const withdraw = async (req, res) => {
  const { accountNumber, amount } = req.body;
  const numberedAmount = Number(amount);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!accountNumber || !amount) {
      return res.status(400).json({
        message: "please enter your important credentials to withdraw",
        success: false,
      });
    }

    const account = await AccountModel.findOne({ accountNumber }).session(
      session,
    );

    if (!account) {
      return res.status(404).json({
        message: "Account Not found",
        success: false,
      });
    }

    if (account.balance < amount) {
      return res.status(400).json({
        message:
          "insufficient balance please withdraw at least equal to the balance",
        success: false,
      });
    }

    if (account.accountType === "savings") {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const withdrawEntries = await ledgerModel
        .find({
          accountNumber,
          type: "debit",
          createdAt: { $gte: twentyFourHoursAgo },
        })
        .session(session);

      const sumWithdrawls = withdrawEntries.reduce(
        (sum, entry) => sum + entry.amount,
        0,
      );

      if (sumWithdrawls >= DAILY_WITHDRAW_CASH_LIMIT) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          message: "daily limit of withdrawl excceded",
          success: false,
        });
      }
    }

    account.balance -= numberedAmount;
    await account.save({ session });

    const createTransactionId = (prefix = "TXN") => {
      const timestamp = Date.now().toString(36);
      const randomStr = Math.random().toString(36).substring(2, 8);
      return `${prefix}-${timestamp}-${randomStr}`.toUpperCase();
    };

    const transactionId = createTransactionId();

    const ledgerEntry = new ledgerModel({
      transactionId,
      accountNumber,
      type: "debit",
      amount: numberedAmount,
      description: "Atm Withdrawal with Daily Velocity Check",
    });

    await ledgerEntry.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "Withdrawl successful",
      success: true,
      amount: account.balance,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({
      message: "internal server error" + error,
      success: false,
    });
  }
};

export { deposit, withdraw };
