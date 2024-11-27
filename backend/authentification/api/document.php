<?php

global $conn;

switch ($_SERVER['REQUEST_METHOD']) {
    case 'POST':
        uploadFile($_POST, $_FILES);
        break;
    case 'GET':
        listDocuments();
        break;
    case 'DELETE':
        $data = json_decode(file_get_contents("php://input"), true);
        deleteDocument($data);
        break;
    default:
        response(['error' => 'Invalid request method'], 405);
        break;
}

// Upload file
function uploadFile($post, $files)
{
    global $conn;

    if (isset($files['file'], $post['user_id'])) {
        $userId = intval($post['user_id']);
        $fileName = $files['file']['name'];
        $fileType = $files['file']['type'];
        $tempPath = $files['file']['tmp_name'];

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

// List documents
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

// Delete document
function deleteDocument($data)
{
    global $conn;

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
