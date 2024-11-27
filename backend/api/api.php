<?php
require_once 'config.php';
header('Content-Type: application/json');

// Determine the endpoint
$pathInfo = $_SERVER['PATH_INFO'] ?? null; // Check if PATH_INFO is set

if (!$pathInfo) {
    // Fallback to REQUEST_URI if PATH_INFO is missing
    $requestUri = $_SERVER['REQUEST_URI'];
    $scriptName = $_SERVER['SCRIPT_NAME'];
    $pathInfo = str_replace(dirname($scriptName), '', $requestUri);
    $pathInfo = strtok($pathInfo, '?'); // Remove query string
}

$route = trim($pathInfo, '/'); // Trim leading and trailing slashes

// Parse the HTTP method
$method = $_SERVER['REQUEST_METHOD'];

// Route handling
switch ($route) {
    case 'register':
        if ($method === 'POST') {
            register();
        } else {
            response(['error' => 'Invalid request method'], 405);
        }
        break;

    case 'login':
        if ($method === 'POST') {
            login();
        } else {
            response(['error' => 'Invalid request method'], 405);
        }
        break;

    case 'upload':
        if ($method === 'POST') {
            uploadFile();
        } else {
            response(['error' => 'Invalid request method'], 405);
        }
        break;

    case 'documents':
        if ($method === 'GET') {
            listDocuments();
        } elseif ($method === 'DELETE') {
            deleteDocument();
        } else {
            response(['error' => 'Invalid request method'], 405);
        }
        break;

    default:
        response(['error' => 'Invalid API endpoint'], 404);
        break;
}

// Functions for handling requests
function register()
{
    global $conn;

    // Decode JSON input
    $data = json_decode(file_get_contents("php://input"), true);

    if (isset($data['user_name'], $data['user_password'])) {
        $userName = $data['user_name'];
        $userPassword = password_hash($data['user_password'], PASSWORD_DEFAULT);

        // Prepare SQL query
        $query = "INSERT INTO user_table (user_name, user_password) VALUES (?, ?)";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("ss", $userName, $userPassword);

        if ($stmt->execute()) {
            response(['message' => 'User registered successfully']);
        } else {
            response(['error' => 'Error registering user'], 500);
        }
    } else {
        response(['error' => 'Invalid input'], 400);
    }
}


function login()
{
    global $conn;
    $data = json_decode(file_get_contents("php://input"), true);

    if (isset($data['user_name'], $data['user_password'])) {
        $userName = $data['user_name'];
        $userPassword = $data['user_password'];

        $query = "SELECT user_id, user_password FROM user_table WHERE user_name = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("s", $userName);
        $stmt->execute();
        $stmt->store_result();

        if ($stmt->num_rows > 0) {
            $stmt->bind_result($userId, $hashedPassword);
            $stmt->fetch();

            if (password_verify($userPassword, $hashedPassword)) {
                response(['message' => 'Login successful', 'user_id' => $userId]);
            } else {
                response(['error' => 'Invalid credentials'], 401);
            }
        } else {
            response(['error' => 'User not found'], 404);
        }
    } else {
        response(['error' => 'Invalid input'], 400);
    }
}

function uploadFile()
{
    global $conn;

    if (isset($_FILES['file'], $_POST['user_id'])) {
        $userId = intval($_POST['user_id']);
        $fileName = $_FILES['file']['name'];
        $fileType = $_FILES['file']['type'];
        $tempPath = $_FILES['file']['tmp_name'];

        // Ensure upload directory exists
        $uploadDir = 'uploads/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $destination = $uploadDir . basename($fileName);

        if (move_uploaded_file($tempPath, $destination)) {
            $query = "INSERT INTO document_table (user_id, document_name, document_type) VALUES (?, ?, ?)";
            $stmt = $conn->prepare($query);
            $stmt->bind_param("iss", $userId, $fileName, $fileType);

            if ($stmt->execute()) {
                response(['message' => 'File uploaded successfully']);
            } else {
                response(['error' => 'Error saving file info to database'], 500);
            }
        } else {
            response(['error' => 'Error uploading file'], 500);
        }
    } else {
        response(['error' => 'Invalid input'], 400);
    }
}

function listDocuments()
{
    global $conn;

    $query = "SELECT * FROM document_table";
    $result = $conn->query($query);

    $documents = [];
    while ($row = $result->fetch_assoc()) {
        $documents[] = $row;
    }

    response(['documents' => $documents]);
}

function deleteDocument()
{
    global $conn;
    $data = json_decode(file_get_contents("php://input"), true);

    if (isset($data['document_id'])) {
        $documentId = intval($data['document_id']);

        $query = "DELETE FROM document_table WHERE document_id = ?";
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $documentId);

        if ($stmt->execute()) {
            response(['message' => 'Document deleted successfully']);
        } else {
            response(['error' => 'Error deleting document'], 500);
        }
    } else {
        response(['error' => 'Invalid input'], 400);
    }
}

// Helper function for sending JSON responses
function response($data, $status_code = 200)
{
    header("Content-Type: application/json");
    http_response_code($status_code);
    echo json_encode($data);
    exit;
}

