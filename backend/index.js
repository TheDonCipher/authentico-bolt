const { PinataSDK } = require("pinata-web3");
const fs = require("fs");
const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
require("dotenv").config();

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.GATEWAY_URL,
});

const app = express();
const port = process.env.PORT || 666;

// Enable CORS for all routes and methods
app.use(cors());

app.use(fileUpload());

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

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
