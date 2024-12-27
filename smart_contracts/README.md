# DocumentNFT - Authentico
This Project is for document verification 

Run of the following tasks:

```shell
npm install

npx hardhat compile

npx hardhat test

npx hardhat ignition deploy ./ignition/modules/DocumentNFT.ts

npx hardhat ignition deploy ignition/modules/DocumentNFT.ts --network sepolia --deployment-id sepolia-deployment

npx hardhat ignition verify sepolia-deployment
```
Deploying and Verifying the Source Code on Sepolia and Etherscan 

DocumentNFTModule#DocumentNFT - 0xc0D23556e7bB853B96a94eCB89a14723DC820986