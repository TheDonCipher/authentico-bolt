const fs = require("fs");
const path = require("path");
const ethers = require("ethers");

// Replace with your local JSON-RPC endpoint (e.g., Hardhat or Ganache)
const LOCAL_RPC_URL = "http://127.0.0.1:8545"; // Update this if using a different port or endpoint
// Replace with the deployer's private key
const DEPLOYER_PRIVATE_KEY =
  "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const APPROVER_PRIVATE_KEY =
  "8166f546bab6da521a8369cab06c5d2b9e46670292d85c875ee9ec20e84ffb61";
async function main() {
  console.log("Starting deployment script...");

  // Step 1: Define output directory and file paths for address and ABI
  const outputDir = path.resolve(__dirname, "../deployed_contracts");
  const addressFile = path.join(outputDir, "DocumentNFT_address.json");
  const abiFile = path.join(outputDir, "DocumentNFT_abi.json");

  // Step 2: Ensure output directory exists; create it if it doesn't
  if (!fs.existsSync(outputDir)) {
    console.log(`Directory does not exist. Creating directory: ${outputDir}`);
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Directory created: ${outputDir}`);
  } else {
    console.log(`Output directory already exists: ${outputDir}`);
  }

  // Step 3: Set up provider and wallet
  const provider = new ethers.providers.JsonRpcProvider(LOCAL_RPC_URL);
  const wallet = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);
  const approver = new ethers.Wallet(APPROVER_PRIVATE_KEY, provider);
  console.log("Deployer account address:", wallet.address);
  console.log("Approver account address:", approver.address);

  // Step 4: Load contract factory for "DocumentNFT"
  console.log("Loading contract factory for DocumentNFT...");
  const DocumentNFTArtifact = require("../../artifacts/contracts/DocumentNFT.sol/DocumentNFT.json");
  const DocumentNFTFactory = new ethers.ContractFactory(
    DocumentNFTArtifact.abi,
    DocumentNFTArtifact.bytecode,
    wallet
  );
  console.log("Contract factory loaded successfully.");

  // Step 5: Deploy the contract
  console.log("Deploying DocumentNFT contract...");
  const documentNFT = await DocumentNFTFactory.deploy(approver.address);
  console.log("Waiting for DocumentNFT contract deployment to be mined...");
  await documentNFT.deployTransaction.wait();
  console.log("DocumentNFT deployed to address:", documentNFT.address);

  // Step 6: Write contract address to JSON file
  console.log(`Writing contract address to file: ${addressFile}`);
  fs.writeFileSync(
    addressFile,
    JSON.stringify({ address: documentNFT.address }, null, 2),
    "utf-8"
  );
  console.log(`Contract address written to ${addressFile}`);

  // Step 7: Write contract ABI to JSON file
  console.log(`Writing contract ABI to file: ${abiFile}`);
  const contractAbi = JSON.stringify(DocumentNFTArtifact.abi, null, 2);
  fs.writeFileSync(abiFile, contractAbi, "utf-8");
  console.log(`Contract ABI written to ${abiFile}`);

  console.log("Deployment script completed successfully.");
}

// Run the script with error handling
main()
  .then(() => {
    console.log("Script executed successfully, exiting...");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error during deployment:", error);
    process.exit(1);
  });
