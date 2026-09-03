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


    public static function patch($path, $callback)
    {
        self::$routes["PATCH"][$path] = $callback;
    }


    public static function delete($path, $callback)
    {
        self::$routes["DELETE"][$path] = $callback;
    }


    public static function dispatch()
    {
        $method = $_SERVER["REQUEST_METHOD"];

        $uri = parse_url(
            $_SERVER["REQUEST_URI"],
            PHP_URL_PATH
        );


        $basePath =
            "/dictation-home/backend/public";


        if (
            str_starts_with(
                $uri,
                $basePath
            )
        ) {

            $uri = substr(
                $uri,
                strlen($basePath)
            );
        }


        foreach (
            self::$routes[$method] ?? []
            as $route => $callback
        ) {

            $pattern = preg_replace(
                '/\{[a-zA-Z]+\}/',
                '([^/]+)',
                $route
            );


            $pattern =
                "#^" . $pattern . "$#";


            if (
                preg_match(
                    $pattern,
                    $uri,
                    $matches
                )
            ) {

                array_shift($matches);


                call_user_func_array(
                    $callback,
                    $matches
                );


                return;
            }
        }


        Response::error(
            "Route not found",
            404
        );
    }
}