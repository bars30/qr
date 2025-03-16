const express = require("express");
const QRCode = require("qrcode");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = 3000;


app.use(cors());

cloudinary.config({
    cloud_name: "dbcvhhh8s",
    api_key: "945354876612195",
    api_secret: "4edffEnZd28HRTsPICWIEO21gvg",
});

// Պահում ենք վերջին վավեր token-ը
let lastValidToken = null;


// Генерация QR-кода в памяти// Երբ QR-ը թարմացվում է, պահում ենք նոր token-ը
async function generateQRCode() {
    lastValidToken = Date.now().toString(); // Նոր վավեր token
    // const qrURL = `http://127.0.0.1:5500/qr-video/index.html?token=${lastValidToken}`;

    const qrBuffer = await QRCode.toBuffer(qrURL);
    try {
        const uploadResponse = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: "images_preset",
                    public_id: `qr_${lastValidToken}`,
                    overwrite: true,
                    resource_type: "image",
                },
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            );

            stream.end(qrBuffer);
        });

        console.log("✅ QR Code uploaded:", uploadResponse.secure_url);
        return uploadResponse.secure_url;
    } catch (error) {
        console.error("Error uploading QR:", error);
        throw new Error(error.message);
    }
}

// API: Ստուգում ենք QR-ի վավերականությունը
app.get("/validate", (req, res) => {
    const { token } = req.query;
    
    if (!token) {
        return res.status(400).json({ error: "Missing token" });
    }

    if (token === lastValidToken) {
        res.json({ success: true, message: "QR Code is valid" });
    } else {
        res.status(403).json({ error: "Invalid QR Code" });
    }
});

// API для генерации нового QR-кода
app.get("/update-qr", async (req, res) => {
    try {
        const qrURL = await generateQRCode();
        console.log(qrURL);
        
        res.json({ success: true, qrURL });
    } catch (error) {
        res.status(500).json({ error: "QR generation failed", details: error.message });
    }
});

// API для получения последнего QR-кода
app.get("/get-qr", async (req, res) => {
    try {
        const { resources } = await cloudinary.search
            .expression("folder:images_preset")
            .sort_by("created_at", "desc")
            .max_results(1)
            .execute();

        if (resources.length > 0) {
            res.json({ qrURL: resources[0].secure_url });
        } else {
            res.status(404).json({ error: "No QR code available" });
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch QR code", details: error.message });
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
