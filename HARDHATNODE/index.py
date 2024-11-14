from flask import Flask, jsonify, request
from web3 import Web3
import json

app = Flask(__name__)

# Connect to local Hardhat node
web3 = Web3(Web3.HTTPProvider("http://localhost:8545"))

print(f"Connected to node: {web3.is_connected()}")
print(f"Chain ID: {web3.eth.chain_id}")

# Load ABI and Contract Address
try:
    with open('ignition/deployed_contracts/DocumentNFT_abi.json', 'r') as abi_file:
        contract_abi = json.load(abi_file)
    
    with open('ignition\\deployed_contracts\\DocumentNFT_address.json', 'r') as address_file:
        contract_address_data = json.load(address_file)
        if isinstance(contract_address_data, str):
            contract_address = contract_address_data.strip()
        elif isinstance(contract_address_data, dict) and 'address' in contract_address_data:
            contract_address = contract_address_data['address'].strip()
        else:
            raise ValueError("Invalid contract address data")
    
    print(f"Parsed Contract Address: {contract_address}")

    # Initialize contract
    contract = web3.eth.contract(address=contract_address, abi=contract_abi)
except Exception as e:
    print(f"Error loading contract data: {e}")
    exit(1)

# Route to get the contract name
@app.route('/contract/name', methods=['GET'])
def get_contract_name():
    try:
        name = contract.functions.name().call()
        return jsonify({"name": name}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Route to get balance of an address
@app.route('/balance/<string:owner>', methods=['GET'])
def get_balance(owner):
    try:
        balance = contract.functions.balanceOf(owner).call()
        return jsonify({"balance": balance}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Route to mint a new Document NFT
@app.route('/mint', methods=['POST'])
def mint_document_nft():
    data = request.get_json()
    to_address = data.get('to')
    document_url = data.get('documentUrl')
    metadata_hash = data.get('metadataHash')
    
    try:
        # Define transaction parameters here
        transaction = contract.functions.mintDocumentNFT(to_address, document_url, metadata_hash).buildTransaction({
            'from': web3.eth.defaultAccount,
            'gas': 2000000,
            'gasPrice': web3.toWei('50', 'gwei'),
            'nonce': web3.eth.getTransactionCount(web3.eth.defaultAccount)
        })
        signed_txn = web3.eth.account.sign_transaction(transaction, private_key="YOUR_PRIVATE_KEY")
        tx_hash = web3.eth.sendRawTransaction(signed_txn.rawTransaction)
        return jsonify({"tx_hash": tx_hash.hex()}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Route to get document details by tokenId
@app.route('/document/<int:token_id>', methods=['GET'])
def get_document_details(token_id):
    try:
        document = contract.functions.getDocumentDetails(token_id).call()
        return jsonify({
            "url": document[0],
            "metadataHash": document[1],
            "isVerified": document[2]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Route to verify document status
@app.route('/verify/<int:token_id>', methods=['POST'])
def verify_document(token_id):
    try:
        transaction = contract.functions.verifyDocument(token_id).buildTransaction({
            'from': web3.eth.defaultAccount,
            'gas': 2000000,
            'gasPrice': web3.toWei('50', 'gwei'),
            'nonce': web3.eth.getTransactionCount(web3.eth.defaultAccount)
        })
        signed_txn = web3.eth.account.sign_transaction(transaction, private_key="YOUR_PRIVATE_KEY")
        tx_hash = web3.eth.sendRawTransaction(signed_txn.rawTransaction)
        return jsonify({"tx_hash": tx_hash.hex()}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
