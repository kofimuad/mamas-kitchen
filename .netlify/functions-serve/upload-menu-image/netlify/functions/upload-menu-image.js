var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// netlify/functions/_auth.js
var require_auth = __commonJS({
  "netlify/functions/_auth.js"(exports2, module2) {
    var failedAttempts = /* @__PURE__ */ new Map();
    function checkAdminPin2(headers) {
      const ip = (headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
      const pin = headers["x-admin-pin"];
      const now = Date.now();
      const windowMs = 15 * 60 * 1e3;
      const maxFails = 10;
      const attempts = (failedAttempts.get(ip) || []).filter((t) => now - t < windowMs);
      if (attempts.length >= maxFails) {
        return { allowed: false, reason: "Too many failed attempts. Try again later." };
      }
      if (!pin || pin !== process.env.ADMIN_PIN) {
        attempts.push(now);
        failedAttempts.set(ip, attempts);
        return { allowed: false, reason: "Unauthorized" };
      }
      failedAttempts.delete(ip);
      return { allowed: true };
    }
    module2.exports = { checkAdminPin: checkAdminPin2 };
  }
});

// netlify/functions/upload-menu-image.js
var { checkAdminPin } = require_auth();
var https = require("https");
var crypto = require("crypto");
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  const auth = checkAdminPin(event.headers);
  if (!auth.allowed) {
    return { statusCode: 401, body: JSON.stringify({ error: auth.reason }) };
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
    const publicId = `obaa-yaas-kitchen/menu/${itemId}`;
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
