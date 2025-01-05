const { PinataSDK } = require("pinata-web3")
const fs = require("fs")
const { Blob } = require("buffer")
require("dotenv").config()



const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.GATEWAY_URL
})

async function upload(){
  try {
    const blob = new Blob([fs.readFileSync("./authentico.txt")]);
    const upload = await pinata.upload.file(blob);
    console.log(upload)
  } catch (error) {
    console.log(error)
  }
}

async function pinataFetch() {
     try {
    const file = await pinata.gateways.get("bafkreiac3t35fklpiwqonav2vj4x2dh6x2zugkdu7dsh6zkaq5jr33lcwy")
    console.log(file.data)
  } catch (error) {
    console.log(error);
  }
 }

pinataFetch()
upload()
