const { ethers } = require("ethers");
const fs = require("fs");
require('dotenv').config({ path: '../backend/.env' });

async function main() {
  console.log("Deploying DocumentNFT contract to Sepolia...");

  // Load contract ABI and bytecode
  const contractJson = require("../artifacts/contracts/DocumentNFT.sol/DocumentNFT.json");
  
  // Set up provider and signer
  const provider = new ethers.providers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
  const wallet = new ethers.Wallet(process.env.SPONSOR_WALLET_PRIVATE_KEY, provider);
  
  // Create contract factory
  const factory = new ethers.ContractFactory(
    contractJson.abi,
    contractJson.bytecode,
    wallet
  );
  
  // Deploy contract
  console.log("Deploying contract...");
  const contract = await factory.deploy();
  console.log("Deployment transaction hash:", contract.deployTransaction.hash);
  
  // Wait for deployment to be mined
  console.log("Waiting for deployment to be mined...");
  await contract.deployed();
  
  console.log("DocumentNFT deployed to:", contract.address);
  
  // Save the contract address to the backend
  fs.writeFileSync(
    "../backend/contractsData/DocumentNFT-address.json",
    JSON.stringify({ address: contract.address }, null, 2)
  );
  
  // Copy the contract ABI to the backend
  fs.writeFileSync(
    "../backend/contractsData/DocumentNFT.json",
    JSON.stringify({ abi: contractJson.abi }, null, 2)
  );
  
  console.log("Contract address and ABI copied to backend directory");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
