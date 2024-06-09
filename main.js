const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const UserModel = require("./models/user.model");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.set("debug", process.env.NODE_ENV != "production");

// Create and Save a new User
app.post("/users", async (req, res) => {
  const { filecid, signature, wallet } = req.body;
  // Validate request
  if (!filecid) {
    res.status(400).send({ message: "filecid can not be empty!" });
    return;
  }

  if (!signature) {
    res.status(400).send({ message: "signature can not be empty!" });
    return;
  }

  if (!wallet) {
    res.status(400).send({ message: "wallet can not be empty!" });
    return;
  }

  // Create a User
  const user = new UserModel({
    filecid: req.body.filecid,
    signature: req.body.signature,
    wallet: req.body.wallet,
  });

  // Save User in the database
  try {
    const data = await user.save();
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the User.",
    });
  }
});

app.get("/users", async (req, res) => {
  const wallet = req.query.wallet;

  try {
    const data = await UserModel.find({ wallet: wallet });
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving users.",
    });
  }
});
