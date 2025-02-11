// This script uses Hardhat Ignition for managing the deployment of DocumentNFT
// Learn more at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import * as fs from "fs";
import * as path from "path";
import { ethers } from "hardhat";

const isLocalDev = true; // Set to true for local deployment

const LOCAL_RPC_URL = process.env.LOCAL_RPC_URL;
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const SEPOLIA_DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

const DocumentNFTModule = buildModule("DocumentNFTModule", (m) => {
  const contract = m.contract("DocumentNFT", []);
  return { contract };
});

export default DocumentNFTModule;






