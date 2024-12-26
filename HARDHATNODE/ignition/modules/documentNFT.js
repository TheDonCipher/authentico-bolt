const fs = require("fs");
const path = require("path");
const { config, ethers } = require("hardhat");
const express = require("express");

const isLocalDev = false; // Set this to false for Sepolia network

// Replace with your local JSON-RPC endpoint (e.g., Hardhat or Ganache)
const LOCAL_RPC_URL = "http://127.0.0.1:8545";

// Sepolia live network
const SEPOLIA_RPC_URL = config.networks.sepolia.url;
const SEPOLIA_DEPLOYER_PRIVATE_KEY =
  config.networks.sepolia.accounts[0].slice(2); // Remove '0x' prefix

async function main() {
  const chalk = (await import("chalk")).default;

  console.log(chalk.blue("Starting deployment script..."));
  console.log(chalk.green("Developer: Born to Code Foundation"));
  console.log(chalk.green("System Information:"));
  console.log(chalk.green(`isLocalDev: ${isLocalDev}`));

  // Step 1: Define output directory and file paths for address and ABI
  const outputDir = path.resolve(
    __dirname,
    "../../../backend/deployed_contracts"
  );
  console.log(chalk.blue("Output directory defined:"), chalk.cyan(outputDir));
  const addressFile = path.join(outputDir, "DocumentNFT_address.json");
  const abiFile = path.join(outputDir, "DocumentNFT_abi.json");

  // Step 2: Ensure output directory exists; create it if it doesn't
  console.log(chalk.blue("Checking if output directory exists..."));
  if (!fs.existsSync(outputDir)) {
    console.log(
      chalk.yellow(`Directory does not exist. Creating directory: ${outputDir}`)
    );
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(chalk.green(`Directory created: ${outputDir}`));
  } else {
    console.log(chalk.green(`Output directory already exists: ${outputDir}`));
  }

  // Step 3: Set up provider and wallet
  console.log(chalk.blue("Setting up provider and wallet..."));
  let provider, wallet;

  if (isLocalDev) {
    console.log(
      chalk.blue("Using local JSON-RPC endpoint for deployment:"),
      chalk.cyan(LOCAL_RPC_URL)
    );
    provider = new ethers.providers.JsonRpcProvider(LOCAL_RPC_URL);
    console.log(chalk.green("Provider set up successfully."));
    const accounts = await ethers.getSigners();
    console.log(chalk.green("Accounts loaded successfully."));
    wallet = accounts[0];
  } else {
    console.log(
      chalk.blue("Using Sepolia network for deployment:"),
      chalk.cyan(SEPOLIA_RPC_URL)
    );
    provider = new ethers.providers.WebSocketProvider(
      SEPOLIA_RPC_URL.replace("https", "wss")
    );
    console.log(chalk.green("Provider set up successfully."));
    wallet = new ethers.Wallet(SEPOLIA_DEPLOYER_PRIVATE_KEY, provider);
  }
  console.log(
    chalk.blue("Deployer account address:"),
    chalk.cyan(wallet.address)
  );

  // Step 4: Load contract factory for "DocumentNFT"
  console.log(chalk.blue("Loading contract factory for DocumentNFT..."));
  const DocumentNFTArtifact = require("../../artifacts/contracts/DocumentNFT.sol/DocumentNFT.json");
  console.log(chalk.green("DocumentNFTArtifact loaded successfully."));
  const DocumentNFTFactory = await ethers.getContractFactory(
    "DocumentNFT",
    wallet
  );
  console.log(chalk.green("Contract factory loaded successfully."));

  // Step 5: Deploy the contract
  console.log(chalk.blue("Deploying DocumentNFT contract..."));
  const documentNFT = await DocumentNFTFactory.deploy();
  console.log(
    chalk.blue("Waiting for DocumentNFT contract deployment to be mined...")
  );
  await documentNFT.deployTransaction.wait();
  console.log(
    chalk.green("DocumentNFT deployed to address:"),
    chalk.cyan(documentNFT.address)
  );

  // Step 6: Write contract address to JSON file
  console.log(chalk.blue(`Writing contract address to file: ${addressFile}`));
  fs.writeFileSync(
    addressFile,
    JSON.stringify({ address: documentNFT.address }, null, 2),
    "utf-8"
  );
  console.log(chalk.green(`Contract address written to ${addressFile}`));

  // Step 7: Write contract ABI to JSON file
  console.log(chalk.blue(`Writing contract ABI to file: ${abiFile}`));
  const contractAbi = JSON.stringify(DocumentNFTArtifact.abi, null, 2);
  fs.writeFileSync(abiFile, contractAbi, "utf-8");
  console.log(chalk.green(`Contract ABI written to ${abiFile}`));

  // Step 8: Start server to listen to contract events
  console.log(chalk.blue("Starting server to listen to contract events..."));
  const app = express();
  const port = 3000;

  documentNFT.on(
    "DocumentVerified",
    (tokenId, owner, urlPicture, holderName, status) => {
      console.log(
        chalk.magenta(
          `DocumentVerified event: tokenId=${tokenId}, owner=${owner}, urlPicture=${urlPicture}, holderName=${holderName}, status=${status}`
        )
      );
      if (!isLocalDev) {
        console.log(
          chalk.magenta(
            `View on explorer: https://sepolia.etherscan.io/tx/${documentNFT.deployTransaction.hash}`
          )
        );
      }
    }
  );

  app.listen(port, () => {
    console.log(chalk.green(`Server listening on port ${port}`));
  });

  console.log(chalk.green("Deployment script completed successfully."));
}

// Run the script with error handling
main()
  .then(() => {
    console.log("Script executed successfully, exiting...");
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Error during deployment:", error);
    process.exit(1);
  });
