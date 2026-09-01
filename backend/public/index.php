<?php

require_once __DIR__ . "/../app/Core/Database.php";

$db = Database::connect();

echo json_encode([
    "success" => true,
    "message" => "Database connected successfully"
]);