// netlify/functions/upload-menu-image.js
var https = require("https");
var crypto = require("crypto");
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  const auth = event.headers["x-admin-secret"];
  if (auth !== process.env.ADMIN_SECRET) {
    return { statusCode: 401, body: "Unauthorized" };
  }
  try {
    const { imageData, itemId } = JSON.parse(event.body);
    if (!imageData || !itemId) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing imageData or itemId" }) };
    }
    const {
      CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET
    } = process.env;
    const timestamp = Math.floor(Date.now() / 1e3);
    const publicId = `mamas-kitchen/menu/${itemId}`;
    const paramsToSign = `overwrite=true&public_id=${publicId}&timestamp=${timestamp}`;
    const signature = crypto.createHash("sha1").update(paramsToSign + CLOUDINARY_API_SECRET).digest("hex");
    const boundary = "----CloudinaryBoundary" + Date.now();
    const fields = {
      file: imageData,
      // base64 data URI — Cloudinary accepts this directly
      public_id: publicId,
      overwrite: "true",
      timestamp: String(timestamp),
      api_key: CLOUDINARY_API_KEY,
      signature
    };
    let body = "";
    for (const [key, val] of Object.entries(fields)) {
      body += `--${boundary}\r
`;
      body += `Content-Disposition: form-data; name="${key}"\r
\r
`;
      body += `${val}\r
`;
    }
    body += `--${boundary}--\r
`;
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    const result = await postToCloudinary(cloudinaryUrl, body, boundary);
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        imageUrl: result.secure_url,
        // permanent HTTPS URL, e.g. https://res.cloudinary.com/...
        publicId: result.public_id
      })
    };
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
function postToCloudinary(url, body, boundary) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": Buffer.byteLength(body)
      }
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) reject(new Error(parsed.error.message));
          else resolve(parsed);
        } catch (e) {
          reject(new Error("Invalid Cloudinary response"));
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}
//# sourceMappingURL=upload-menu-image.js.map
