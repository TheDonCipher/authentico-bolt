require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.0",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.24", // Example of another version
        settings: {
          // Additional settings for 0.7.6
        },
      },
      {
        version: "0.6.12", // Example of another version
        settings: {
          // Additional settings for 0.7.6
        },
      },
      {
        version: "0.8.20", // Example of another version
        settings: {
          // Additional settings for 0.7.6
        },
      },
      // Add more versions as needed
    ],
  },
};
