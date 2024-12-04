<?php

require '../inc/dbcon.php';

function error422($message){

    $data = [
        'status' => 422, 
        'message' => $message,
    ];
    header("HTTP/1.0 422 Unprocessable Entity");
    echo json_encode($data);
    exit();
}

function storeUser($userInput){

    global $conn;

    $name = mysqli_real_escape_string($conn, $userInput['name']);
    $password = mysqli_real_escape_string($conn, $userInput['password']);

    if(empty(trim($name))){

        return error422('Enter your name');

    }elseif(empty(trim($password))){

        return error422('Enter your password');
        
    }
    else
    {

        $query = "INSERT INTO users (name, user_password) VALUES ('$name', '$password')";
        $result = mysqli_query($conn, $query);

        if($result){

            $data = [
                'status' => 201, 
                'message' => 'User Created Successfully',
            ];
            header("HTTP/1.0 201 Created");
            return json_encode($data);

        }else{
            $data = [
                'status' => 500, 
                'message' => 'Internal Server Error',
            ];
            header("HTTP/1.0 500 Internal Server Error");
            return json_encode($data);
        }
    }


}

function getUserList(){

    global $conn;
    
    $query = "SELECT * FROM users";
    
    if (empty($query)) {
        
        $data = [
            'status' => 500, 
            'message' => 'Query is empty',
        ];
        header("HTTP/1.0 500 Internal Server Error");
        return json_encode($data);
    }
    
    $query_run = mysqli_query($conn, $query);  
    
    if ($query_run) {
        if (mysqli_num_rows($query_run) > 0) {
            
            $res = mysqli_fetch_all($query_run, MYSQLI_ASSOC);
            
            $data = [
                'status' => 200, 
                'message' => 'User List Fetched Successfully',
                'data' => $res,  
            ];
            header("HTTP/1.0 200 Success");
            return json_encode($data); 
        } else {
            
            $data = [
                'status' => 404, 
                'message' => 'User Not Found',
            ];
            header("HTTP/1.0 404 Not Found");
            return json_encode($data);  
        }
    } else {
        
        $data = [
            'status' => 500, 
            'message' => 'Internal Server Error',
        ];
        header("HTTP/1.0 500 Internal Server Error");
        return json_encode($data);
    }
}

function getUser($userParams){

    global $conn;

    if($userParams['id'] == null){

        return error422('Enter your user id');
    }

    $userId = mysqli_real_escape_string($conn, $userParams['id']);

    $query = "SELECT * FROM users WHERE id = '$userId' LIMIT 1";
    $result = mysqli_query($conn, $query);

    if($result){
        if(mysqli_num_rows($result) == 1)
        {
            $res = mysqli_fetch_assoc($result);

            $data = [
                'status' => 200, 
                'message' => 'User Fetched Successfully',
                'data' => $res
            ];
            header("HTTP/1.0 200 Success");
            return json_encode($data);
        }
        else
        {
            $data = [
                'status' => 404, 
                'message' => 'User Not Found',
            ];
            header("HTTP/1.0 404 Not Found");
            return json_encode($data);   
        }
    
    }else{

        $data = [
            'status' => 500, 
            'message' => 'Internal Server Error',
        ];
        header("HTTP/1.0 500 Internal Server Error");
        return json_encode($data);

    }

}

function updateUser($userInput, $userParams){

    global $conn;

    if(!isset($userParams['id'])){

        return error422('User id not found in URL');

    }elseif($userParams['id'] == null){
        return error422('Enter user id');
    }

    $userId = mysqli_real_escape_string($conn, $userParams['id']);

    $name = mysqli_real_escape_string($conn, $userInput['name']);
    $password = mysqli_real_escape_string($conn, $userInput['user_password']);

    if(empty(trim($name))){

        return error422('Enter your name');

    }elseif(empty(trim($password))){

        return error422('Enter your password');
        
    }
    else
    {

        $query = "UPDATE users SET name='$name', user_password='$password' WHERE id='$userId' LIMIT 1";
        $result = mysqli_query($conn, $query);

        if($result){

            $data = [
                'status' => 200, 
                'message' => 'User Updated Successfully',
            ];
            header("HTTP/1.0 200 Success");
            return json_encode($data);

        }else{
            $data = [
                'status' => 500, 
                'message' => 'Internal Server Error',
            ];
            header("HTTP/1.0 500 Internal Server Error");
            return json_encode($data);
        }
    }


}

function deleteUser($userParams){
    
    global $conn;

    if(!isset($userParams['id'])){

        return error422('User id not found in URL');

    }elseif($userParams['id'] == null){
        return error422('Enter user id');
    }

    $userId = mysqli_real_escape_string($conn, $userParams['id']);

    $query = "DELETE FROM users WHERE id='$userId' LIMIT 1";
    $result = mysqli_query($conn, $query);

    if($result){

        $data = [
            'status' => 200, 
            'message' => 'User deleted successfully',
        ];
        header("HTTP/1.0 200 Success");
        return json_encode($data);

    }else{

        $data = [
            'status' => 404, 
            'message' => 'User not found',
        ];
        header("HTTP/1.0 404 Not found");
        return json_encode($data);
    }
}

?>
