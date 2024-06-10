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
const { sign } = require("crypto");
const { decodeAddress } = require("@polkadot/keyring");

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

// get file from hash using public folder {hash}.ext
app.get("/hash/:hash", async (req, res) => {
  try {
    const hash = req.params.hash;
    //  get files in public folder
    const files = fs.readdirSync("./public");

    const file = files.find((file) => file.startsWith(hash));

    console.log("./public/" + file);

    if (file) {
      const filePath = path.resolve(__dirname, "./public/" + file);
      res.sendFile(filePath);
    }
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});
// upload file
app.post("/upload", async (req, res) => {
  upload(req, res, async (err) => {
    try {
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
    } catch (error) {
      res.status(400).send({ message: error.message });
    }
  });
});

app.get("/userWallet/:wallet", async (req, res) => {
  try {
    let documents = [];
    const userWallet = req.params.wallet;
    // get all users that have same hash
    const data = await UserModel.find({ walletAddress: userWallet });
    documents = [...data];

    // iterate through the data and get the file hash
    for (let i = 0; i < data.length; i++) {
      // find everyother user with the same file hash not userWallet
      const fileHash = data[i].fileHash;
      const signers = await UserModel.find({
        fileHash: fileHash,
        walletAddress: { $ne: userWallet },
      });
      documents.push(...signers);
    }

    res.send(documents);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

app.post("/saveSigners", async (req, res) => {
  // save an array in the database
  const signers = req.body;

  if (!signers) {
    return res.status(400).send({ message: "No signers found" });
  }

  for (let signer of signers) {
    if (!signer.address || !signer.hash) {
      continue;
    }

    // Check if there are existing records with the given file hash
    const existingRecords = await UserModel.find({ fileHash: signer.hash });

    if (existingRecords.length > 0) {
      // If existing records are found, ensure the length of signers is 1
      if (signers.length > 1) {
        return res.status(400).send({
          message: `Signers must have a length of 1 for file hash ${signer.hash}`,
        });
      }
    }
  }

  for (var signer of signers) {
    if (!signer.address || !signer.hash) {
      continue;
    }

    try {
      decodeAddress(signer.address);
    } catch (error) {
      console.log(error);
      console.log(signer.address);
      continue;
    }
    const data = await UserModel.find({
      walletAddress: signer.address,
      fileHash: signer.hash,
    });

    if (data.length > 0) {
      // edit signature
      const data = await UserModel.findOneAndUpdate(
        { walletAddress: signer.address },
        { signature: signer.signature }
      );
      continue;
    } else {
      // save new signer
      const user = new UserModel({
        fileHash: signer.hash,
        signature: signer.signature,
        walletAddress: signer.address,
      });

      const data = await user.save();

      // Save User in the database
      try {
      } catch (err) {
        res.status(500).send({
          message:
            err.message || "Some error occurred while creating the User.",
        });
      }
    }
  }

  res.send({ message: "success" });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
