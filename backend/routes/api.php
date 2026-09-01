<?php


/*
|--------------------------------------------------------------------------
| Test Route
|--------------------------------------------------------------------------
*/

Router::get("/api/v1/test", function () {

    Response::success(
        [],
        "API is working"
    );

});



/*
|--------------------------------------------------------------------------
| Auth Routes
|--------------------------------------------------------------------------
*/


Router::post("/api/v1/auth/register", function () {

    $db = Database::connect();

    $controller = new AuthController($db);

    $controller->register();

});



Router::post("/api/v1/auth/login", function () {

    $db = Database::connect();

    $controller = new AuthController($db);

    $controller->login();

});