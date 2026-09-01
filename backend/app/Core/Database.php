<?php

class Database
{
    private static $connection = null;

    public static function connect()
    {
        if (self::$connection === null) {

            $config = require __DIR__ . "/../../config/database.php";

            try {

                self::$connection = new PDO(
                    "mysql:host={$config['host']};dbname={$config['database']};charset={$config['charset']}",
                    $config['username'],
                    $config['password']
                );

                self::$connection->setAttribute(
                    PDO::ATTR_ERRMODE,
                    PDO::ERRMODE_EXCEPTION
                );

            } catch (PDOException $e) {

                die(json_encode([
                    "success" => false,
                    "message" => "Database connection failed",
                    "error" => $e->getMessage()
                ]));

            }
        }

        return self::$connection;
    }
}