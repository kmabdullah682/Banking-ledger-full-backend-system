import AccountModel from "../models/accounts.models.js";
import ledgerModel from "../models/ledger.models.js";
import mongoose from "mongoose";

const DAILY_SAVINGS_LIMIT = 5;
const DAILY_WITHDRAW_CASH_LIMIT = 10000;
const EXCHANGE_RATES = {
  USD: { EUR: 0.92, GBP: 0.78, USD: 1.0 },
  EUR: { USD: 1.09, GBP: 0.85, EUR: 1.0 },
  GBP: { USD: 1.28, EUR: 1.18, GBP: 1.0 },
};

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

const transaferBalance = async (req, res) => {
  const { sourceAccountId, destinationAccountId, amount } = req.body;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!sourceAccountId || !destinationAccountId || !amount) {
      return res.status(400).json({
        message:
          "please provide your important credentials to transfer the balance",
        success: false,
      });
    }

    const senderAccount = await AccountModel.findOne({
      accountNumber: sourceAccountId,
    }).session(session);
    const receiverAccount = await AccountModel.findOne({
      accountNumber: destinationAccountId,
    }).session(session);

    if (!senderAccount) {
      await session.abortTransaction();
      return res.status(404).json({
        message:
          "account not found please create an account to transfer balance",
        success: false,
      });
    }

    if (!receiverAccount) {
      await session.abortTransaction();
      return res.status(404).json({
        message:
          "account not found please create an account to receive balance",
        success: false,
      });
    }

    if (senderAccount.balance < amount) {
      await session.abortTransaction();
      return res.status(400).json({
        message:
          "your account doesn't have sufficient balance to transfer please deposit balance to transfer",
        success: false,
      });
    }

    const senderCurrency = senderAccount.currency;
    const receiverCurrency = receiverAccount.currency;

    const conversionRate = EXCHANGE_RATES[senderCurrency][receiverCurrency];
    const receiverAmount = Math.round(amount * conversionRate);

    senderAccount.balance -= amount;
    await senderAccount.save({ session });
    receiverAccount.balance += receiverAmount;
    await receiverAccount.save({ session });

    const createTransactionId = (prefix = "TXN") => {
      const timestamp = Date.now().toString(36);
      const randomStr = Math.random().toString(36).substring(2, 8);
      return `${prefix}-${timestamp}-${randomStr}`.toUpperCase();
    };

    const transactionId = createTransactionId();

    const senderLedger = new ledgerModel({
      transactionId,
      accountNumber: sourceAccountId,
      type: "debit",
      amount,
      description: `transfering balance of ${amount}`,
    });

    const receiverLedger = new ledgerModel({
      transactionId,
      accountNumber: destinationAccountId,
      type: "credit",
      amount: receiverAmount,
      description: `received balance of ${receiverAmount}`,
    });

    await senderLedger.save({ session });
    await receiverLedger.save({ session });

    await session.commitTransaction();

    return res.status(200).json({
      message: "Transfer successful",
      success: true,
      sourceAccount: sourceAccountId,
      destinationAccount: destinationAccountId,
      transferredAmount: amount,
      receivedAmount: receiverAmount,
    });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({
      message: "Internal server error " + error,
      success: false,
    });
  } finally {
    session.endSession();
  }
};

export { deposit, withdraw, transaferBalance };
