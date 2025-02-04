
const express = require("express");
const { e } = require("hardhat");
const fs = require("fs");
const path = require("path");

console.log(`here is path`, path.resolve(__dirname, "ignition/deployments/chain-31337/artifacts/DocumentNFTModule#DocumentNFT.json"))

// Environment Configuration
const isLocalDev = false; // Set to false for Sepolia
const LOCAL_RPC_URL = process.env.LOCAL_RPC_URL || "http://localhost:8545";

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;// Replace with actual RPC URL

// Paths to Contract ABI and Address
const CONTRACT_ABI_PATH = path.resolve(__dirname, "ignition/deployments/chain-31337/artifacts/DocumentNFTModule#DocumentNFT.json");
const CONTRACT_ADDRESS_PATH = path.resolve(__dirname, "ignition/deployments/chain-31337/deployed_addresses.json");

console.log(`here is abi`, CONTRACT_ABI_PATH)


// Load Contract Address and ABI
const contractAbi = JSON.parse(fs.readFileSync(CONTRACT_ABI_PATH, "utf-8"));
const contractAddress = JSON.parse(fs.readFileSync(CONTRACT_ADDRESS_PATH, "utf-8"));

// Initialize Provider and Signer
const provider = isLocalDev
  ? new ethers.providers.JsonRpcProvider(LOCAL_RPC_URL)
  : new ethers.providers.JsonRpcProvider(SEPOLIA_RPC_URL);
const wallet = isLocalDev
  ? provider.getSigner()
  : new ethers.Wallet("2698e2b8fd205ff4fbbdd5e7271a3bdf087440a4d62fd73aa7cc22449b75bb3c", provider); // Replace with actual private key

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
    const tx = await contract.mintDocumentNFT(to, documentUrl, holderName, nationalID, metadataHash);
    await tx.wait();
    res.json({ message: "Document NFT minted successfully", txHash: tx.hash });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
