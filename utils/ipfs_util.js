const { Storage, LogLevel, FileStatus } = require("@apillon/sdk");
require("dotenv").config();
const { sha256 } = require("./sha256.js");

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

    const results = await bucket.uploadFiles(
      [
        {
          fileName: sha256(fileBuffer.buffer),
          contentType: fileBuffer.mimetype,
          content: fileBuffer,
        },
      ],
      { wrapWithDirectory: false }
    );

    console.log(results);
  };
}

module.exports = { ApillionStore };
