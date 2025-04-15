require('dotenv').config({ path: '../backend/.env' });
require('@nomiclabs/hardhat-ethers');

module.exports = {
  solidity: '0.8.20',
  networks: {
    sepolia: {
      url: process.env.BLOCKCHAIN_RPC_URL,
      accounts: [process.env.SPONSOR_WALLET_PRIVATE_KEY],
    },
  },
  paths: {
    artifacts: './artifacts',
    cache: './cache',
    sources: './contracts',
    tests: './test',
  },
};
