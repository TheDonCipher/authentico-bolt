const { PinataSDK } = require("pinata-web3");
const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
require("dotenv").config();

const { User } = require("./config");
const authRoutes = require("./authRoutes");
const { verifyToken } = require("./authMiddleware");
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(fileUpload());

// Pinata setup
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.GATEWAY_URL,
});

// Routes
app.use("/api/auth", authRoutes);

// Public routes
app.get("/", async (req, res) => {
  const snapshot = await User.get();
  const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  res.send(list);
});

// Protected routes
app.post("/upload", verifyToken, async (req, res) => {
  try {
    if (!req.files?.document_file) {
      return res.status(400).send("No files were uploaded.");
    }

    const uploadedFile = req.files.document_file;
    const blob = new Blob([uploadedFile.data]);
    const file = new File([blob], uploadedFile.name, {
      type: uploadedFile.mimetype,
    });

    const upload = await pinata.upload.file(file);
    res.json({ IpfsHash: upload.IpfsHash });
  } catch (error) {
    console.error(error);
    res.status(500).send("Upload failed");
  }
});

app.post("/create", verifyToken, async (req, res) => {
  const data = req.body;
  await User.add({ data });
  res.send({ msg: "User Added" });
});

app.post("/update", verifyToken, async (req, res) => {
  const id = req.body.id;
  delete req.body.id;
  await User.doc(id).update(req.body);
  res.send({ msg: "Updated" });
});

app.post("/delete", verifyToken, async (req, res) => {
  await User.doc(req.body.id).delete();
  res.send({ msg: "Deleted" });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const port = process.env.PORT || 666;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
