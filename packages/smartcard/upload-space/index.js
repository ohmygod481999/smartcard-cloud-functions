const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const parseMultipart = require("parse-multipart");
const {
    ACCESS_KEY_ID,
    SECRET_ACCESS_KEY,
    SPACE_URL,
    SPACE_REGION,
} = require("./config");

const extractFile = (args) => {
    const boundary = parseMultipart.getBoundary(args.headers["content-type"]);
    const files = parseMultipart.Parse(
        Buffer.from(args.body, "base64"),
        boundary
    );
    const [{ filename, data }] = files;

    return {
        filename,
        data,
    };
};

exports.main = async (args) => {
    console.log(args.headers)
    console.log(args.body)
    console.log(args.file)
    const { filename, data } = extractFile(args);

    console.log(filename, data);

    // Step 2: The s3Client function validates your request and directs it to your Space's specified endpoint using the AWS SDK.
    const s3Client = new S3Client({
        endpoint: SPACE_URL, // Find your endpoint in the control panel, under Settings. Prepend "https://".
        region: SPACE_REGION, // Must be "us-east-1" when creating new Spaces. Otherwise, use the region in your endpoint (e.g. nyc3).
        credentials: {
            accessKeyId: ACCESS_KEY_ID, // Access key pair. You can create access key pairs using the control panel or API.
            secretAccessKey: SECRET_ACCESS_KEY, // Secret access key defined through an environment variable.
        },
    });

    // Step 3: Define the parameters for the object you want to upload.
    const params = {
        Bucket: "long-space", // The path to the directory you want to upload the object to, starting with your Space name.
        Key: filename, // Object key, referenced whenever you want to access this file later.
        Body: data, // The object's contents. This variable is an object, not a string.
        ACL: "public", // Defines ACL permissions, such as private or public.
        Metadata: {
            // Defines metadata tags.
        },
    };

    // Step 4: Define a function that uploads your object using SDK's PutObjectCommand object and catches any errors.
    try {
        const data = await s3Client.send(new PutObjectCommand(params));
        console.log(
            "Successfully uploaded object: " + params.Bucket + "/" + params.Key
        );
        return {
            success: false,
            msg: "err",
            data,
        };
    } catch (err) {
        console.log("Error", err);
        return {
            success: false,
            msg: "err",
            data: null,
        };
    }
};
