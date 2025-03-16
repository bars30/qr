const express = require("express");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const qrCodePath = path.join(__dirname, "qr_code.png");
const qrDataFile = path.join(__dirname, "last_qr.json");

// Վերջին QR-ի պահպանում ֆայլում
function saveQRData(data) {
    fs.writeFileSync(qrDataFile, JSON.stringify(data));
}

// Վերջին QR-ի ստացում
function getLastQRData() {
    if (fs.existsSync(qrDataFile)) {
        return JSON.parse(fs.readFileSync(qrDataFile));
    }
    return null;
}

// QR կոդի գեներացում
async function generateQRCode() {
    const newToken = Date.now().toString(); // Յուրահատուկ token
    const qrURL = `http://69.62.120.133/?token=${newToken}`;

    await QRCode.toFile(qrCodePath, qrURL);
    saveQRData({ token: newToken, url: qrURL });
    console.log("✅ New QR Code Generated:", qrURL);
}

// API՝ նոր QR կոդ գեներացնելու համար (Windows Task Scheduler-ի համար)
app.get("/update-qr", async (req, res) => {
    await generateQRCode();
    res.sendFile(qrCodePath);
});

// API՝ վերջին QR կոդը ստանալու համար
app.get("/get-qr", (req, res) => {
    if (fs.existsSync(qrCodePath)) {
        res.sendFile(qrCodePath);
    } else {
        res.status(404).json({ error: "No QR code available" });
    }
});

// API՝ QR կոդի վավերացման համար
app.get("/validate", (req, res) => {
    const { token } = req.query;
    const lastQR = getLastQRData();

    if (lastQR && lastQR.token === token) {
        res.json({ access: true });
    } else {
        res.json({ access: false });
    }
});

// Սերվերի մեկնարկ
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://69.62.120.133:${PORT}`);
});
