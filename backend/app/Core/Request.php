<?php

class Request
{
    public static function method()
    {
        return $_SERVER["REQUEST_METHOD"];
    }


    public static function body()
    {
        $input = file_get_contents("php://input");

        if (!$input) {
            return [];
        }

        return json_decode($input, true) ?? [];
    }


    public static function header($key)
    {
        $headers = getallheaders();

        return $headers[$key] ?? null;
    }
}