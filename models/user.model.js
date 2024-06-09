// model with filecid, signature, and wallet address
const mongoose = require("mongoose");

const UserSchema = mongoose.Schema(
  {
    filecid: String,
    signature: String,
    wallet: String,
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

module.exports = mongoose.model("User", UserSchema);
