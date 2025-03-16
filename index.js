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

    // Загрузка QR-кода в Cloudinary через stream
    try {
        const uploadResponse = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: "images_preset",
                    public_id: `qr_${newToken}`,
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

            stream.end(qrBuffer); // Отправляем buffer как stream
        });

        console.log("✅ QR Code uploaded to Cloudinary:", uploadResponse.secure_url);
        return uploadResponse.secure_url;
    } catch (error) {
        console.error("Error uploading to Cloudinary:", error);
        throw new Error(error.message);
    }
}

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
