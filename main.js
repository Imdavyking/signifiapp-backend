const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const UserModel = require("./models/user.model");
const app = express();
require("dotenv").config();
const multer = require("multer");
const { ApillionStore } = require("./utils/ipfs_util");
const port = process.env.PORT || 3100;
const fs = require("fs");
const { sha256 } = require("./utils/sha256");
const path = require("path");

app.use(cors());
app.use(bodyParser.json());
const storage = multer.diskStorage({
  destination: "./public/", // Directory to save the uploaded files
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now());
  },
});
// Initialize upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 }, // Limit file size to 1MB
  fileFilter: function (req, file, cb) {
    return cb(null, true);
  },
}).single("ipfs_file"); // The name 'myFile' should match the form field name

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// use uploads folder
app.use(express.static("public"));

mongoose.set("debug", process.env.NODE_ENV != "production");

// upload file
app.post("/upload", async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      res.status(400).send({ message: err.message });
    } else {
      if (req.file == undefined) {
        res.status(400).send({ message: "No file selected!" });
      } else {
        const filePath = "./public/" + req.file.filename;

        const buffer = fs.readFileSync(filePath);

        const hash = await sha256(buffer);

        const extension = path.extname(req.file.originalname);

        fs.writeFileSync("./public/" + hash + extension, buffer);

        let result = await ApillionStore.uploadFile(req.file);
        res.send({ message: "File uploaded successfully!" });
      }
    }
  });
});

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
    walletAddress: req.body.wallet,
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
    const data = await UserModel.find({ walletAddress: wallet });
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving users.",
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
