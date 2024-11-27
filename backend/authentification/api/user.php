<?php
require_once '../config.php';

// Helper function for sending JSON responses
function response($data, $status_code = 200)
{
    header('Content-Type: application/json');
    http_response_code($status_code);
    echo json_encode($data);
    exit;
}

// Parse HTTP method and request
$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'POST':
        if (isset($data['action'])) {
            switch ($data['action']) {
                case 'register':
                    register($data);
                    break;
                case 'login':
                    login($data);
                    break;
                default:
                    response(['error' => 'Invalid action'], 400);
            }
        } else {
            response(['error' => 'Action not specified'], 400);
        }
        break;

    default:
        response(['error' => 'Invalid request method'], 405);
        break;
}

function register($data)
{
    global $conn;

    if (isset($data['user_name'], $data['user_password'])) {
        $userName = $data['user_name'];
        $userPassword = password_hash($data['user_password'], PASSWORD_DEFAULT);

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

function login($data)
{
    global $conn;

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
