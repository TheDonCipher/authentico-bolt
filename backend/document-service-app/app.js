const express = require('express');
const multer = require('multer');
const db = require('./db');
const path = require('path');

const app = express();
app.use(express.json());

// Set up Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

// Upload a document
app.post('/upload', upload.single('document'), async (req, res) => {
    console.log('File received:', req.file); // Log the received file
    const { originalname, mimetype, size } = req.file;

    try {
        const [result] = await db.execute(
            'INSERT INTO documents (name, type, size) VALUES (?, ?, ?)',
            [originalname, mimetype, size]
        );
        console.log('Database insertion result:', result); // Log DB response

        res.status(201).json({
            message: 'Document uploaded successfully',
            documentId: result.insertId,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to upload document' });
    }
});

// Fetch all documents
app.get('/documents', async (req, res) => {
    try {
        const [documents] = await db.execute('SELECT * FROM documents');
        res.status(200).json(documents);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
