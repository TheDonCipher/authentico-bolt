# Document Service

This is a Node.js-based document management system that allows users to upload files, store metadata, and integrate with Pinata for IPFS storage. The API has been tested using Postman.

## Features

-Upload documents via API

-Store metadata in a database

-Integrate with Pinata for decentralized storage

-CRUD operations for managing documents

## Installation

[1] Clone the repository:
>git clone <repo-url>

[2] Navigate into the project folder:
>cd document-service

[3] Install dependencies:
>npm install

## Environment Variables

Create a .env file in the root directory and configure your Pinata API credentials:
>PINATA_API_KEY=your_api_key
 PINATA_SECRET_API_KEY=your_secret_key
 PORT=3000
 DB_HOST=localhost
 DB_USER=root
 DB_PASSWORD=
 DB_NAME=document_service

## Database Setup

-Import the SQL file into your database:

-Located in db/document_service.sql

-Ensure your database credentials match those in .env

## Running the Application

>node app.js

Server will start at: http://localhost:3000

## Upload Document

>POST /upload

Body (form-data):
>document: File to upload

Response:
>{
  "message": "File uploaded successfully to IPFS",
  "ipfsHash": "Qm...",
  "pinSize": 12345,
  "timestamp": "2025-02-11T12:00:00Z"
}

## Fetch All Documents

>GET /documents

Response: List of all uploaded documents.

## Fetch a Single Document

>GET /documents/:id

## Delete a Document

>DELETE /documents/:id

## Postman Testing

-Import the API collection into Postman.

## Technologies Used

-Backend: Node.js, Express.js

-Database: MySQL

-Storage: Pinata (IPFS)

-Testing: Postman