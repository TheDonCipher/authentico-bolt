<?php
$requestUri = $_SERVER['REQUEST_URI'];
$requestParts = explode('/', trim($requestUri, '/'));
$endpoint = $requestParts[0] ?? ''; // First part of the path
$routeFile = "api/$endpoint.php";

if (file_exists($routeFile)) {
    require_once $routeFile;
} else {
    header("Content-Type: application/json");
    http_response_code(404);
    echo json_encode(["error" => "Invalid API endpoint"]);
    exit;
}

require_once 'config.php';

header('Content-Type: application/json');

// Determine the endpoint and method
$path = $_SERVER['PATH_INFO'] ?? '/';
$method = $_SERVER['REQUEST_METHOD'];

// Extract the first part of the path
$parts = explode('/', trim($path, '/'));
$resource = $parts[0] ?? null;

// Route to the correct API handler
switch ($resource) {
    case 'user':
        require_once 'api/user.php';
        break;
    case 'document':
        require_once 'api/document.php';
        break;
    default:
        response(['error' => 'Invalid API endpoint'], 404);
        break;
}

// Helper response function
function response($data, $status_code = 200)
{
    http_response_code($status_code);
    echo json_encode($data);
    exit;
}
