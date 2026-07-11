import mongoose from "mongoose";

const ledgerSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
    },

    accountNumber: {
      type: String,
      required: [true, "Account number string is required for a transaction"],
      index: true,
    },

    type: {
      type: String,
      enum: ["credit", "debit"],
      required: [true, "transaction type is required for a transaction"],
    },

    amount: {
      type: Number,
      required: [true, "amount is required for a transaction"],
    },

    description: {
      type: String,
      required: [true, "a transaction requires description"],
    },
  },
  { timestamps: true },
);

const ledgerModel = mongoose.model("Ledger", ledgerSchema);

export default ledgerModel;
