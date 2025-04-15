const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying DocumentNFT contract to Sepolia...");

  // Deploy the contract
  const DocumentNFT = await hre.ethers.getContractFactory("DocumentNFT");
  const documentNFT = await DocumentNFT.deploy();

  await documentNFT.waitForDeployment();
  
  const deployedAddress = await documentNFT.getAddress();
  console.log("DocumentNFT deployed to:", deployedAddress);
  
  // Save the contract address
  const addressData = {
    address: deployedAddress
  };
  
  // Get the contract ABI
  const artifact = require("../artifacts/contracts/DocumentNFT.sol/DocumentNFT.json");
  const abiData = {
    abi: artifact.abi
  };
  
  // Ensure backend contractsData directory exists
  const backendContractsDir = path.join(__dirname, "../../backend/contractsData");
  if (!fs.existsSync(backendContractsDir)) {
    fs.mkdirSync(backendContractsDir, { recursive: true });
  }
  
  // Write files to backend
  fs.writeFileSync(
    path.join(backendContractsDir, "DocumentNFT-address.json"),
    JSON.stringify(addressData, null, 2)
  );
  
  fs.writeFileSync(
    path.join(backendContractsDir, "DocumentNFT.json"),
    JSON.stringify(abiData, null, 2)
  );
  
  console.log("Contract address and ABI saved to backend directory");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
