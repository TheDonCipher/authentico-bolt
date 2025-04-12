const { PinataSDK } = require("pinata-web3");
const fs = require("fs");
const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
require("dotenv").config();

const User = require("./config");
const app = express();
app.use(express.json());
app.use(cors());

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.GATEWAY_URL,
});

const port = process.env.PORT || 666;

app.use(fileUpload());
app.get("/", async (req, res) => {
  const snapshot = await User.get();
  const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  res.send(list);
});

app.post("/upload", async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send("No files were uploaded.");
    }
    console.log("========---- start debuing ----  req.files :", req.files);
    console.log("env files are --:", process.env.PINATA_JWT);
    console.log("env file for gateway url  key --:", process.env.GATEWAY_URL);

    const uploadedFile = req.files.document_file; // Match the file input name from the frontend
    const blob = new Blob([uploadedFile.data]);
    const file = new File([blob], uploadedFile.name, {
      type: uploadedFile.mimetype,
    });
    console.log("pinata tokens :", pinata);
    console.log("uploaded file :", uploadedFile);
    console.log("blob :", blob);

    const upload = await pinata.upload.file(file);
    res.json({ IpfsHash: upload.IpfsHash });
    console.log("File uploaded successfully", upload.IpfsHash);
    console.log("File uploaded successfully", upload.PinSize);
    console.log("File uploaded successfully", upload.Timestamp);
    console.log("File uploaded successfully", upload.PinStatus);
    console.log("File uploaded successfully", upload.PinataMetadata);
  } catch (error) {
    console.log(error);
    res.status(500).send("An error occurred while uploading the file.");
  }
});

app.post("/create", async (req, res) => {
  const data = req.body;
  console.log("data from frontend :", data);
  await User.add({ data });
  console.log("data added to firebase :", data);
  console.log("data added to firebase :", User);
  console.log("data added to firebase :", User.doc(data.id));
  res.send({ msg: "User Added" });
});

app.post("/update", async (req, res) => {
  const id = req.body.id;
  delete req.body.id;
  const data = req.body;
  await User.doc(id).update(data);
  res.send({ msg: "Updated" });
});

app.post("/delete", async (req, res) => {
  const id = req.body.id;
  await User.doc(id).delete();
  res.send({ msg: "Deleted" });
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
