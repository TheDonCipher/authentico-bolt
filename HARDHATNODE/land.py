from flask import Flask, jsonify, request
from web3 import Web3
import json
from datetime import datetime, timedelta
import mysql.connector
import secrets

app = Flask(__name__)

# Connect to local Hardhat node
web3 = Web3(Web3.HTTPProvider("http://localhost:8545"))

print(f"Connected to node: {web3.is_connected()}")
print(f"Chain ID: {web3.eth.chain_id}")

# Load ABI and Contract Address
try:
    with open('ignition/deployed_contracts/LandTitleDeed_abi.json', 'r') as abi_file:
        contract_abi = json.load(abi_file)
    
    with open('ignition/deployed_contracts/LandTitleDeed_address.json', 'r') as address_file:
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

# Database connection configuration
db_config = {
    "host": "localhost",
    "user": "root",
    "password": "",
    "database": "mzuniadmin"
}

# Generate a random string
def generate_random_string():
    return secrets.token_hex(16)

# Route to mint title deed and handle application processing
@app.route('/api/title-deed', methods=['GET'])
def create_title_deed():
    application_id = request.args.get('application_id', type=int)
    random_string = generate_random_string()

    try:
        # Connect to the database
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        # Fetch application details
        cursor.execute("""
            SELECT 
                applications.id AS application_number,
                users.id AS user_id,
                users.full_name,
                users.nation_id,
                users.phone_number,
                land.land_id AS land_code,
                land.type AS land_type,
                land.layout AS land_layout_url,
                applications.application_date
            FROM applications
            LEFT JOIN users ON applications.user_id = users.id
            LEFT JOIN land ON applications.land_id = land.land_id
            WHERE applications.id = %s
        """, (application_id,))
        rows = cursor.fetchall()

        if len(rows) == 0:
            raise Exception("Application not found.")

        application_data = rows[0]

        # Mint title deed on Ethereum
        transaction = contract.functions.mintTitleDeed(
            application_data['user_id'],
            random_string,
            application_data['full_name'],
            application_data['land_code'],
            application_data['nation_id'],
            application_data['phone_number'],
            application_data['land_type'],
            application_data['land_layout_url']
        ).buildTransaction({
            'from': web3.eth.accounts[0],
            'gas': 2000000,
            'gasPrice': web3.toWei('50', 'gwei'),
            'nonce': web3.eth.getTransactionCount(web3.eth.accounts[0])
        })

        private_key = "YOUR_PRIVATE_KEY"  # Replace with your actual private key
        signed_txn = web3.eth.account.sign_transaction(transaction, private_key=private_key)
        tx_hash = web3.eth.send_raw_transaction(signed_txn.rawTransaction)
        receipt = web3.eth.wait_for_transaction_receipt(tx_hash)

        # Update database
        cursor.execute("""
            UPDATE land SET owner_id = %s, land_status = %s WHERE land_id = %s
        """, (application_data['user_id'], 0, application_data['land_code']))

        cursor.execute("""
            INSERT INTO title_deeds 
            (appllication_number, deed_number, approved, expiary_date, title_deed, type)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            application_data['application_number'],
            random_string,
            1,
            (datetime.now() + timedelta(days=99 * 365)).strftime('%Y-%m-%d'),
            application_data['full_name'],
            application_data['land_type']
        ))

        cursor.execute("""
            INSERT INTO blockchain_transactions 
            (user_id, transaction_hash, title_deed_number, title_deed_name, land_code, owner_nation_id, owner_phone_number, land_type, land_layout_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            application_data['user_id'],
            receipt.transactionHash.hex(),
            random_string,
            application_data['full_name'],
            application_data['land_code'],
            application_data['nation_id'],
            application_data['phone_number'],
            application_data['land_type'],
            application_data['land_layout_url']
        ))

        conn.commit()
        conn.close()

        return jsonify({
            "message": "Title deed created successfully.",
            "transaction_hash": receipt.transactionHash.hex()
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
