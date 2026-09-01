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



/*
|--------------------------------------------------------------------------
| User Routes
|--------------------------------------------------------------------------
*/


Router::get("/api/v1/me", function () {

    $db = Database::connect();

    $auth = new AuthMiddleware($db);

    $user = $auth->handle();


    Response::success(
        $user,
        "Authenticated user"
    );

});



/*
|--------------------------------------------------------------------------
| Folder Routes
|--------------------------------------------------------------------------
*/


Router::get("/api/v1/folders", function () {

    $db = Database::connect();

    $auth = new AuthMiddleware($db);

    $user = $auth->handle();


    $controller = new FolderController($db);

    $controller->index($user);

});



Router::post("/api/v1/folders", function () {

    $db = Database::connect();

    $auth = new AuthMiddleware($db);

    $user = $auth->handle();


    $controller = new FolderController($db);

    $controller->store($user);

});


/*
|--------------------------------------------------------------------------
| Word Routes
|--------------------------------------------------------------------------
*/


Router::get("/api/v1/folders/{folderId}/words", function ($folderId) {

    $db = Database::connect();

    $auth = new AuthMiddleware($db);

    $user = $auth->handle();


    $controller = new WordController($db);

    $controller->index($folderId);

});



Router::post("/api/v1/folders/{folderId}/words", function ($folderId) {

    $db = Database::connect();

    $auth = new AuthMiddleware($db);

    $user = $auth->handle();


    $controller = new WordController($db);

    $controller->store($folderId);

});