const express = require('express');
const multer = require('multer');
const PinataSDK = require('@pinata/sdk');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());

// Pinata setup
const pinata = new PinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_API_KEY);

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Temporary storage location
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    },
});

const upload = multer({ storage });

// Upload document to Pinata
app.post('/upload', upload.single('document'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const fileStream = require('fs').createReadStream(req.file.path); // Read uploaded file
        const pinataOptions = {
            pinataMetadata: {
                name: req.file.originalname,
                keyvalues: {
                    uploadedBy: 'Document Service App', // Additional metadata
                },
            },
            pinataOptions: {
                cidVersion: 1,
            },
        };

        const result = await pinata.pinFileToIPFS(fileStream, pinataOptions); // Upload to Pinata
        console.log('Pinata upload result:', result);

        res.status(201).json({
            message: 'File uploaded successfully to IPFS',
            ipfsHash: result.IpfsHash,
            pinSize: result.PinSize,
            timestamp: result.Timestamp,
        });
    } catch (error) {
        console.error('Pinata upload error:', error);
        res.status(500).json({ error: 'Failed to upload file to Pinata' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
