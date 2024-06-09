// model with filecid, signature, and wallet address
const mongoose = require("mongoose");

const UserSchema = mongoose.Schema(
  {
    fileHash: String,
    signature: String,
    walletAddress: String,
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  { collection: "signers" }
);

module.exports = mongoose.model("User", UserSchema);
