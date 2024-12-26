const express = require("express");
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Environment Configuration
const isLocalDev = false; // Set to false for Sepolia
const LOCAL_RPC_URL = "http://127.0.0.1:8545";
const SEPOLIA_RPC_URL =
  "https://sepolia.infura.io/v3/fbe90be3403d47068b85a400a75fb456"; // Replace with actual RPC URL
const CONTRACT_ABI_PATH = path.resolve(__dirname, "DocumentNFT_abi.json");
const CONTRACT_ADDRESS_PATH = path.resolve(
  __dirname,
  "DocumentNFT_address.json"
);

// Load Contract Address and ABI
const contractAbi = JSON.parse(fs.readFileSync(CONTRACT_ABI_PATH, "utf-8"));
const contractAddress = JSON.parse(
  fs.readFileSync(CONTRACT_ADDRESS_PATH, "utf-8")
).address;

// Initialize Provider and Signer
const provider = isLocalDev
  ? new ethers.providers.JsonRpcProvider(LOCAL_RPC_URL)
  : new ethers.providers.JsonRpcProvider(SEPOLIA_RPC_URL);
const wallet = isLocalDev
  ? provider.getSigner()
  : new ethers.Wallet(
      "2698e2b8fd205ff4fbbdd5e7271a3bdf087440a4d62fd73aa7cc22449b75bb3c",
      provider
    ); // Replace with actual private key

// Initialize Contract Instance
const contract = new ethers.Contract(contractAddress, contractAbi, wallet);

// Express App Setup
const app = express();
const PORT = 666;
app.use(express.json());

// API Endpoints

// 1. Get Contract Verifier Address
app.get("/api/verifier", async (req, res) => {
  try {
    const verifier = await contract.verifier();
    res.json({ verifier });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Set Verifier Address
app.post("/api/verifier", async (req, res) => {
  try {
    const { newVerifier } = req.body;
    const tx = await contract.setVerifier(newVerifier);
    await tx.wait();
    res.json({ message: "Verifier updated successfully", txHash: tx.hash });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Mint Document NFT
app.post("/api/mint", async (req, res) => {
  try {
    const { to, documentUrl, holderName, nationalID, metadataHash } = req.body;
    const tx = await contract.mintDocumentNFT(
      to,
      documentUrl,
      holderName,
      nationalID,
      metadataHash
    );
    await tx.wait();
    res.json({ message: "Document NFT minted successfully", txHash: tx.hash });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Verify Document
app.post("/api/verify", async (req, res) => {
  try {
    const { tokenId } = req.body;
    const tx = await contract.verifyDocument(tokenId);
    await tx.wait();
    res.json({ message: "Document verified successfully", txHash: tx.hash });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Get Document Details
app.get("/api/document/:tokenId", async (req, res) => {
  try {
    const tokenId = req.params.tokenId;
    const document = await contract.getDocumentDetails(tokenId);
    res.json({ document });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Change Document Status
app.post("/api/status", async (req, res) => {
  try {
    const { tokenId, status } = req.body;
    const tx = await contract.changeStatus(tokenId, status);
    await tx.wait();
    res.json({
      message: "Document status updated successfully",
      txHash: tx.hash,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Event Listener for DocumentVerified
contract.on(
  "DocumentVerified",
  (tokenId, owner, urlPicture, holderName, status) => {
    console.log(
      `Event: DocumentVerified | TokenId: ${tokenId} | Owner: ${owner} | URL: ${urlPicture} | Holder: ${holderName} | Status: ${status}`
    );
  }
);

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
