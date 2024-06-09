const { Storage, LogLevel, FileStatus } = require("@apillon/sdk");
require("dotenv").config();
const { sha256 } = require("./sha256.js");
const fs = require("fs");

class ApillionStore {
  static uploadFile = async (fileBuffer) => {
    const storage = new Storage({
      key: process.env.APP_STORE_KEY,
      secret: process.env.APP_STORE_SECRET,
      logLevel: LogLevel.NONE,
    });

    // list buckets
    await storage.listBuckets({ limit: 5 });

    // create and instance of a bucket directly through uuid
    const bucket = storage.bucket(process.env.BUCKET_UUID);

    //read file from path
    const filePath = "./upload/" + fileBuffer.filename;

    const buffer = fs.readFileSync(filePath);

    const hash = await sha256(buffer);

    const results = await bucket.uploadFiles(
      [
        {
          fileName: hash,
          contentType: fileBuffer.mimetype,
          content: fileBuffer,
        },
      ],
      { wrapWithDirectory: false }
    );

    return results;
  };
}

module.exports = { ApillionStore };
