# API Documentation

## Overview

This API provides CRUD (Create, Read, Update, Delete) operations for user management. It is structured within the backend/api directory and is tested using Postman.

## Folder Structure

backend/
  ├── api/
      ├── db/
      │   ├── authentico.sql   # Database schema
      │   ├── setup.php        # Script to initialize database
      ├── inc/
      │   ├── dbcon.php        # Database connection file
      ├── users/
      │   ├── create.php       # Create a new user
      │   ├── delete.php       # Delete a user
      │   ├── function.php     # Stores function variables
      │   ├── login.php        # User authentication
      │   ├── read.php         # Fetch user details
      │   ├── update.php       # Update user details
      ├── README.md            # API documentation

## Setup Instructions

1-Clone the repository or download the API folder.

2-Download Laragon/Xamp/Wamp server

3-Download PhpMyAdmin and add to Laragon installation folder

4-Import db/authentico.sql into your MySQL database.

5-Configure database credentials in inc/dbcon.php.

6-Run db/setup.php to initialize the database.

7-Use Postman or any API testing tool to interact with the API.

## API Endpoints

[1] Create User

>Endpoint: POST /users/create.php

Request Body:

{
  "name": "John Doe",
  "email": "johndoe@example.com",
  "password": "password123"
}

Response:
{
  "message": "User created successfully",
  "id": 1
}


[2] Read User

>Endpoint: GET /users/read.php?id=1

Response:
{
  "id": 1,
  "name": "John Doe",
  "email": "johndoe@example.com"
}


[3] Update User

>Endpoint: PUT /users/update.php

Request Body:
{
  "id": 1,
  "name": "John Updated",
  "email": "johnupdated@example.com"
}

Response:
{
  "message": "User updated successfully"
}


[4] Delete User

>Endpoint: DELETE /users/delete.php

Request Body:
{
  "id": 1
}

Response:
{
  "message": "User deleted successfully"
}


[5] User Login

>Endpoint: POST /users/login.php

Request Body:
{
  "email": "johndoe@example.com",
  "password": "password123"
}

Response:
{
  "message": "Login successful",
  "token": "your_jwt_token_here"
}

## Notes

-Ensure that Apache and MySQL are running in Laragon.

-Test the endpoints in Postman with appropriate HTTP methods.