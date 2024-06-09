import { Storage, LogLevel, FileStatus } from "@apillon/sdk";

class ApillionStore {
  static uploadFile = async (fileBuffer) => {
    const storage = new Storage({
      key: config.public.APP_STORE_KEY,
      secret: config.public.APP_STORE_SECRET,
      logLevel: LogLevel.NONE,
    });

    // list buckets
    await storage.listBuckets({ limit: 5 });

    // create and instance of a bucket directly through uuid
    const bucket = storage.bucket("uuid");

    const results = await bucket.uploadFiles(
      [
        {
          fileName: "contract.json",
          contentType: "application/json",
          content: fileBuffer,
        },
      ],
      { wrapWithDirectory: false }
    );

    console.log(results);
  };
}
