<?php

class Router
{
    private static $routes = [];


    public static function get($path, $callback)
    {
        self::$routes["GET"][$path] = $callback;
    }


    public static function post($path, $callback)
    {
        self::$routes["POST"][$path] = $callback;
    }


    public static function dispatch()
    {
        $method = $_SERVER["REQUEST_METHOD"];

        $uri = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);

$basePath = "/dictation-home/backend/public";

if (str_starts_with($uri, $basePath)) {
    $uri = substr($uri, strlen($basePath));
}


        if (isset(self::$routes[$method][$uri])) {

            call_user_func(
                self::$routes[$method][$uri]
            );

            return;
        }


        Response::error(
            "Route not found",
            404
        );
    }
}