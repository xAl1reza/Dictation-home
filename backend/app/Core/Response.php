<?php

class Response
{
    public static function json($data, $statusCode = 200)
    {
        http_response_code($statusCode);

        header("Content-Type: application/json; charset=UTF-8");

        echo json_encode(
            $data,
            JSON_UNESCAPED_UNICODE
        );

        exit;
    }


    public static function success($data = [], $message = null)
    {
        self::json([
            "success" => true,
            "message" => $message,
            "data" => $data
        ]);
    }


    public static function error($message, $statusCode = 400, $errors = [])
    {
        self::json([
            "success" => false,
            "message" => $message,
            "errors" => $errors
        ], $statusCode);
    }
}