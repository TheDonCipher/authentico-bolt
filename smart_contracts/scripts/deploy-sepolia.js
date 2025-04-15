const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying DocumentNFT contract to Sepolia...");

  // Get the contract factory
  const DocumentNFT = await ethers.getContractFactory("DocumentNFT");
  
  // Deploy the contract
  const documentNFT = await DocumentNFT.deploy();
  
  // Wait for deployment to finish
  await documentNFT.deployed();
  
  console.log("DocumentNFT deployed to:", documentNFT.address);
  
  // Save the contract address to a file
  const fs = require("fs");
  const contractsDir = __dirname + "/../contractsData";
  
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }
  
  // Save address
  fs.writeFileSync(
    contractsDir + "/DocumentNFT-address.json",
    JSON.stringify({ address: documentNFT.address }, null, 2)
  );
  
  // Copy the contract artifact to the backend
  fs.copyFileSync(
    __dirname + "/../artifacts/contracts/DocumentNFT.sol/DocumentNFT.json",
    __dirname + "/../../backend/contractsData/DocumentNFT.json"
  );
  
  // Copy the address to the backend
  fs.writeFileSync(
    __dirname + "/../../backend/contractsData/DocumentNFT-address.json",
    JSON.stringify({ address: documentNFT.address }, null, 2)
  );
  
  console.log("Contract address and artifacts copied to backend directory");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
