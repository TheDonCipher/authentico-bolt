# Minimal Hardhat Project for Authentico Smart Contracts

## Overview

This Hardhat project provides a minimal setup for developing, testing, and deploying smart contracts for the Authentico platform. It is designed to be lightweight and focused, ideal for smart contract development, demonstrations, and testing without the complexities of a larger project structure.

### Key Features

- **Focused Smart Contract Development**: Optimized for efficient Solidity smart contract development with a clear and concise project structure.
- **Hardhat Configuration**: Includes a pre-configured `hardhat.config.js` with essential settings for local Hardhat network, test networks, Solidity compiler, and Authentico smart contracts.
- **DocumentNFT Contract**: Contains the main DocumentNFT contract that handles document verification and status management on the blockchain.
- **Deployment and Interaction Scripts**: Includes JavaScript scripts in the `scripts/` directory to automate smart contract deployment and interaction, simplifying deployment to different networks and contract interaction for testing and validation.
- **Minimal Dependencies**: `package.json` configured with minimal dependencies for a lightweight and efficient development environment focused on smart contract workflows.
- **Plugin Support**: Features Hardhat Toolbox for enhanced development, testing, gas reporting, and code coverage, with ethers.js integration.

## Smart Contract Details

The main smart contract in this project is `DocumentNFT.sol`, which implements the following features:

- **Document NFT Minting**: Creates a unique NFT for each document uploaded to the platform.
- **Verification Status Management**: Tracks the verification status of each document (New, Verified, Rejected).
- **Access Control**: Ensures only authorized verifiers can change document statuses.
- **Event Emission**: Emits events when documents are minted or verified for off-chain tracking.

## Getting Started

### Prerequisites

- **Node.js (>=18.x) and npm (>=8.x)**: Ensure Node.js 18+ and npm 8+ are installed.

### Setup

1. **Clone Repository**:
   ```bash
   git clone <repository-url>
   cd authentico
   ```

2. **Install Dependencies**:
   From the project root directory, run:
   ```bash
   npm install
   ```
   
   or from the minimal-hardhat directory:
   ```bash
   cd minimal-hardhat
   npm install
   ```

### Smart Contract Development Workflow

Key steps for developing smart contracts in this project:

#### Compile Contracts

Compile Solidity smart contracts in the `contracts/` directory:
```bash
npx hardhat compile
```
Generates contract artifacts (ABIs, bytecode) in `artifacts/`, essential for deployment and interaction.

#### Run Tests

Execute unit tests located in the `test/` directory:
```bash
npx hardhat test
```
Verifies smart contract functionality through tests in `test/`.

#### Deploy Contracts

Deploy smart contracts to blockchain networks:

1. **Configure Networks**:
   - Edit `hardhat.config.js` to configure network settings.
   - In `networks`, define target blockchain networks. Specify network names (e.g., `hardhat`, `sepolia`, `mainnet`), RPC URLs, and deployment account details.
   - Configure private keys or mnemonics for deployment accounts.
   - Default `hardhat.config.js` is set for a local Hardhat network. Customize `networks` for deployment targets, including test and main networks.

2. **Prepare Deployment Scripts**:
   - Modify scripts in `scripts/`.
   - Utilize Hardhat's ethers plugin and deployment libraries in scripts.
   - Adapt `deploy.js` in `scripts/` for your contracts and deployment needs. Ensure scripts handle contract deployment and constructor arguments.

3. **Execute Deployment**:
   Deploy to a specified network:
   ```bash
   npx hardhat run scripts/deploy.js --network <network-name>
   ```
   Replace `<network-name>` with the configured network name in `hardhat.config.js` (e.g., `hardhat` for local, `sepolia` for Sepolia testnet). Ensure sufficient funds for gas fees on public networks when deploying to test or main networks.

### Interacting with Deployed Contracts

After deploying the contracts, you can interact with them using the Hardhat console or custom scripts:

1. **Hardhat Console**:
   ```bash
   npx hardhat console --network <network-name>
   ```

2. **Custom Scripts**:
   Create and run custom scripts to interact with deployed contracts:
   ```bash
   npx hardhat run scripts/interact.js --network <network-name>
   ```

### Project Structure

```
minimal-hardhat/
├── contracts/         # Solidity smart contracts
│   └── DocumentNFT.sol # Main document verification contract
├── scripts/          # Deployment and interaction scripts
│   ├── deploy.js     # Contract deployment script
│   └── interact.js   # Contract interaction script
├── test/             # Test files
│   └── DocumentNFT.test.js # Tests for the DocumentNFT contract
├── hardhat.config.js  # Hardhat configuration file
├── package.json      # Project dependencies and scripts
├── package-lock.json # Dependency lock file
└── README.md         # Project documentation
```

### Dependencies

- **Hardhat**: Ethereum development environment for smart contract development, testing, and deployment. [Hardhat Documentation](https://hardhat.org/)
- **@nomicfoundation/hardhat-toolbox**: Hardhat plugins for enhanced development, including testing, gas reporting, and code coverage, with ethers.js integration.
- **ethers**: Library for interacting with the Ethereum blockchain, used within Hardhat for contract deployment and testing. [Ethers Documentation](https://docs.ethers.io/v5/)
- **@openzeppelin/contracts**: Library of secure, reusable smart contract components. [OpenZeppelin Documentation](https://docs.openzeppelin.com/)

## Integration with Authentico Backend

The Authentico backend interacts with the deployed smart contracts through the `BlockchainService.js` service, which uses ethers.js to:

1. **Mint Document NFTs**: When a document is uploaded, the backend mints a new NFT representing the document.
2. **Update Verification Status**: When a document is verified or rejected, the backend updates the status on the blockchain.
3. **Retrieve Document Details**: The backend can retrieve document details from the blockchain for verification purposes.

The integration requires the following environment variables to be set in the backend:

- `CONTRACT_ADDRESS`: The address of the deployed DocumentNFT contract.
- `BLOCKCHAIN_RPC_URL`: The RPC URL for the Ethereum network (e.g., Sepolia testnet).
- `SPONSOR_WALLET_PRIVATE_KEY`: The private key of the wallet used to sign transactions.
- `SEPOLIA_CHAIN_ID`: The chain ID of the Sepolia testnet (default: 11155111).

## Contribution

Contributions are welcome. Please adhere to the following guidelines:

- **Coding Standards**: Follow Solidity coding standards and best practices.
- **Commit Messages**: Use clear, concise, and descriptive commit messages.
- **Testing**: Include unit tests for new features and changes.
- **Pull Requests**: Submit well-structured pull requests with clear descriptions.
- **Documentation**: Update relevant documentation to reflect changes.

For more detailed contribution guidelines, please refer to [CONTRIBUTING.md](../docs/CONTRIBUTING.md) in the project documentation.

## License

This project is proprietary and provided under the Authentico license. See the `LICENSE` file for license details. All rights reserved.
