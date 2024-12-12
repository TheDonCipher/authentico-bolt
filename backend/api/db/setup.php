<?php
if (isset($_POST['setup'])) {
    $host = "localhost";
    $username = "root";
    $password = "";
    $dbname = "authentico";

    // Connect to MySQL
    $conn = mysqli_connect($host, $username, $password);

    if (!$conn) {
        die("<p>Connection Failed: " . mysqli_connect_error() . "</p>");
    }

    // Create Database
    $createDbQuery = "CREATE DATABASE IF NOT EXISTS $dbname";
    if (mysqli_query($conn, $createDbQuery)) {
        echo "<p>Database '$dbname' created successfully.</p>";
    } else {
        die("<p>Error creating database: " . mysqli_error($conn) . "</p>");
    }

    // Select Database
    mysqli_select_db($conn, $dbname);

    // Create Table
    $createTableQuery = "CREATE TABLE IF NOT EXISTS users (
        id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        user_password VARCHAR(255) NOT NULL,
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

    if (mysqli_query($conn, $createTableQuery)) {
        echo "<p>Table 'users' created successfully.</p>";
    } else {
        die("<p>Error creating table: " . mysqli_error($conn) . "</p>");
    }

    // Insert Data
    $insertDataQuery = "INSERT INTO users (id, name, email, user_password) VALUES
    (1, 'sonia kim', 'soniakim@gmail.com', 'kim9823#'),
    (2, 'travis banda', 'travisbanda@gmail.com', '13657#'),
    (3, 'joana phiri', 'joanaphiri@gmail.com', 'phiri2827#'),
    (4, 'abdul karim', 'abdulkarim@gmail.com', '103055#'),
    (5, 'henry frank', 'frankie@gmail.com', 'frankie265#'),
    (6, 'trevor watson', 'watson67@gmail.com', 'trev7654#'),
    (7, 'lisa banda', 'bandalisa@gmail.com', 'lisa2567#'),
    (8, 'jim curry', 'curry76@gmail.com', 'jimcurry66#'),
    (9, 'jason mzati', 'mzatij2@gmail.com', 'j2mzati32#');";

    if (mysqli_query($conn, $insertDataQuery)) {
        echo "<p>Data inserted successfully into 'users' table.</p>";
    } else {
        echo "<p>Error inserting data: " . mysqli_error($conn) . "</p>";
    }

    // Close Connection
    mysqli_close($conn);
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Setup Database</title>
</head>
<body>
    <h1>Setup Database and Insert Data</h1>
    <form method="POST">
        <button type="submit" name="setup">Run Setup</button>
    </form>
</body>
</html>
