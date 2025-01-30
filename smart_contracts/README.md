# DocumentNFT - Authentico

This project is for document verification using blockchain technology.

## Prerequisites

Before you begin, ensure you have met the following requirements:
- Node.js and npm installed
- Hardhat installed globally

## Steps to Run the Project

### Step 1: Install Dependencies

To install all the necessary packages, run:

```sh
npm install
```

### Step 2: Start a local blockchain node

To start the hardhat local node with two accounts, run:

```sh
npm hardhat node
```

### Step 3: Compile Solidity code

To compile the smart contract, run:

```sh
npx hardhat compile
```

### Step 4: Deploy the smart contract into the Local Node

To deploy the smart contract into the local blockchain node, run:

```sh
npx hardhat ignition deploy ./ignition/modules/DocumentNFT.ts --network localhost
```

Find deployments:

```sh
Deployed address
\smart_contracts\ignition\deployments\chain-31337\deployed_addresses.json
```

And

```sh
ABI 
smart_contracts\ignition\deployments\chain-31337\artifacts\DocumentNFTModule#DocumentNFT.json
```

### OR

```sh
npx hardhat ignition deploy ignition/modules/DocumentNFT.ts --network sepolia --deployment-id sepolia-deployment
```

Find deployments:

```sh
Deployed Address
smart_contracts\ignition\deployments\sepolia-deployment\deployed_addresses.json
```

And

```sh
ABI
smart_contracts\ignition\deployments\sepolia-deployment\artifacts\DocumentNFTModule#DocumentNFT.json
```

If Sepolia:

```sh
npx hardhat ignition verify sepolia-deployment
```

### Step 5: Start Node Server for interacting with Smart Contract

Go to the backend workspace. It will use the address and ABI to interact with the Smart Contract.

Deployed and Verified Source Code on Sepolia and Etherscan:

```sh
DocumentNFTModule#DocumentNFT - 0xc0D23556e7bB853B96a94eCB89a14723DC820986
```
````