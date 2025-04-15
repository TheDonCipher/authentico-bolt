const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Deploying DocumentNFT contract to Sepolia...');

  // Get the contract factory
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying with account:', deployer.address);

  const DocumentNFT = await hre.ethers.getContractFactory('DocumentNFT');

  // Deploy the contract
  const documentNFT = await DocumentNFT.deploy();
  await documentNFT.deployed();

  console.log('DocumentNFT deployed to:', documentNFT.address);

  // Save the contract address to the backend
  const backendContractsDir = path.join(
    __dirname,
    '../../backend/contractsData'
  );
  if (!fs.existsSync(backendContractsDir)) {
    fs.mkdirSync(backendContractsDir, { recursive: true });
  }

  // Save address
  fs.writeFileSync(
    path.join(backendContractsDir, 'DocumentNFT-address.json'),
    JSON.stringify({ address: documentNFT.address }, null, 2)
  );

  // Get the contract ABI
  const artifact = require('../artifacts/contracts/DocumentNFT.sol/DocumentNFT.json');

  // Save ABI
  fs.writeFileSync(
    path.join(backendContractsDir, 'DocumentNFT.json'),
    JSON.stringify({ abi: artifact.abi }, null, 2)
  );

  console.log('Contract address and ABI saved to backend directory');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
