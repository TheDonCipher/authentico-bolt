// filepath: /c:/Users/BEST USER/Documents/projects/htdocs/hardhatNode/authentico-bolt/HARDHATNODE/websocket-server.js
const WebSocket = require("ws");
const ethers = require("ethers");
const chalk = require("chalk");

const provider = new ethers.providers.WebSocketProvider(
  "wss://sepolia.infura.io/ws/v3/15383749f6b44f8288da149b3df726f8"
);
const contractAddress = require("./ignition/deployed_contracts/DocumentNFT_address.json").address;
const contractABI = require("./ignition/deployed_contracts/DocumentNFT_abi.json");

const contract = new ethers.Contract(contractAddress, contractABI, provider);

const wss = new WebSocket.Server({ port: 8080 });

wss.on("connection", (ws) => {
  console.log(chalk.green("Client connected"));

  // Listen to DocumentVerified events
  contract.on(
    "DocumentVerified",
    (tokenId, owner, urlPicture, holderName, status) => {
      const eventData = {
        tokenId: tokenId.toString(),
        owner,
        urlPicture,
        holderName,
        status,
      };
      console.log(
        chalk.blue("DocumentVerified event:"),
        chalk.cyan(JSON.stringify(eventData, null, 2))
      );

      // Send the event data to the connected client
      ws.send(JSON.stringify(eventData));
    }
  );

  // Handle client disconnection
  ws.on("close", () => {
    console.log(chalk.red("Client disconnected"));
  });
});

console.log(chalk.green("WebSocket server is listening on port 8080"));
