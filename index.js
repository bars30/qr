const express = require("express");
const QRCode = require("qrcode");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

const app = express();
const PORT = 3000;

cloudinary.config({
    cloud_name: "dbcvhhh8s",
    api_key: "945354876612195",
    api_secret: "4edffEnZd28HRTsPICWIEO21gvg",
});

// Генерация QR-кода в памяти
async function generateQRCode() {
    const newToken = Date.now().toString(); // Генерируем уникальный токен
    const qrURL = `https://qr-nine-pi.vercel.app/validate?token=${newToken}`;

    // Генерация QR-кода в Buffer
    const qrBuffer = await QRCode.toBuffer(qrURL);

    // Загрузка QR-кода в Cloudinary
    const uploadResponse = await cloudinary.uploader.upload_stream(
        {
            folder: "images_preset",
            public_id: `qr_${newToken}`,
            overwrite: true,
        },
        (error, result) => {
            if (error) {
                console.error("Error uploading to Cloudinary:", error);
                throw new Error(error.message);
            }
            console.log("✅ QR Code uploaded to Cloudinary:", result.secure_url);
            return result.secure_url;
        }
    );

    // Пишем Buffer в Cloudinary
    uploadResponse.end(qrBuffer);
}

// API для генерации нового QR-кода
app.get("/update-qr", async (req, res) => {
    try {
        const qrURL = await generateQRCode();
        console.log("✅ QR Code generated:", qrURL);
        
        res.json({ success: true, qrURL });
    } catch (error) {
        res.status(500).json({ error: "000QR generation failed", details: error.message });
    }
});

// API для получения последнего QR-кода
app.get("/get-qr", async (req, res) => {
    try {
        const { resources } = await cloudinary.search
            .expression("folder:qr_codes")
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
