const AWS = require("aws-sdk");
const Jimp = require("jimp");
const s3 = new AWS.S3();

exports.handler = async (event) => {
  try {
    // Assuming the event contains the S3 bucket and key of the image
    const bucket = event.Records[0].s3.bucket.name;
    const { key } = event.Records[0].s3.object;

    // Read the image from S3
    const getObjectParams = { Bucket: bucket, Key: key };
    const originalImageObject = await s3.getObject(getObjectParams).promise();
    console.log("Original Image Object:", originalImageObject);

    // Extract MIME type directly from S3 object metadata
    const originalMimeType = originalImageObject.ContentType;
    console.log("Image MIME Type:", originalMimeType);

    // Resize the image using Jimp
    const originalImage = await Jimp.read(originalImageObject.Body);

    // Perform the resizing and explicitly set the MIME type to "image/jpeg"
    const resizedImageBuffer = await originalImage
      .resize(200, 200)
      .getBufferAsync("image/jpeg");

    // Upload the resized image back to S3
    const putObjectParams = {
      Bucket: bucket,
      Key: `resized-${key}`,
      Body: resizedImageBuffer,
      ContentType: originalMimeType, // Set the desired MIME type for the resized image
    };
    await s3.putObject(putObjectParams).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Image resized and uploaded successfully",
      }),
    };
  } catch (error) {
    console.error("Error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
