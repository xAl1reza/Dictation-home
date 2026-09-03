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

    $controller->index(
    $user,
    $folderId
);

});



Router::post("/api/v1/folders/{folderId}/words", function ($folderId) {

    $db = Database::connect();

    $auth = new AuthMiddleware($db);

    $user = $auth->handle();


    $controller = new WordController($db);

    $controller->store(
    $user,
    $folderId
);

});

/*
|--------------------------------------------------------------------------
| Game Result Routes
|--------------------------------------------------------------------------
*/


Router::post("/api/v1/game-results", function () {

    $db = Database::connect();

    $auth = new AuthMiddleware($db);

    $user = $auth->handle();


    $controller = new GameResultController($db);

    $controller->store($user);

});


Router::get("/api/v1/game-results", function () {

    $db = Database::connect();

    $auth = new AuthMiddleware($db);

    $user = $auth->handle();


    $controller = new GameResultController($db);

    $controller->history($user);

});

/*
|--------------------------------------------------------------------------
| Dashboard Routes
|--------------------------------------------------------------------------
*/


Router::get("/api/v1/dashboard/stats", function () {

    $db = Database::connect();

    $auth = new AuthMiddleware($db);

    $user = $auth->handle();


    $controller = new DashboardController($db);

    $controller->index($user);

});

/*
|--------------------------------------------------------------------------
| Science Question Routes
|--------------------------------------------------------------------------
*/


Router::get("/api/v1/folders/{folderId}/science-questions", function ($folderId) {

    $db = Database::connect();

    $auth = new AuthMiddleware($db);

    $user = $auth->handle();


    $controller = new ScienceQuestionController($db);

    $controller->index(
        $user,
        $folderId
    );

});


Router::post("/api/v1/folders/{folderId}/science-questions", function ($folderId) {

    $db = Database::connect();

    $auth = new AuthMiddleware($db);

    $user = $auth->handle();


    $controller = new ScienceQuestionController($db);

    $controller->store(
        $user,
        $folderId
    );

});

/*
|--------------------------------------------------------------------------
| Public News Routes
|--------------------------------------------------------------------------
*/


Router::get("/api/v1/news", function () {

    $db = Database::connect();

    $controller = new NewsController($db);

    $controller->index();

});


Router::get("/api/v1/news/{slug}/related", function ($slug) {

    $db = Database::connect();

    $controller = new NewsController($db);

    $controller->related($slug);

});


Router::get("/api/v1/news/{slug}", function ($slug) {

    $db = Database::connect();

    $controller = new NewsController($db);

    $controller->show($slug);

});

/*
|--------------------------------------------------------------------------
| Iran Map Public Routes
|--------------------------------------------------------------------------
*/


Router::get("/api/v1/iran-map/provinces", function () {

    $db = Database::connect();

    $controller =
        new PartnerSchoolController($db);

    $controller->provinces();

});


Router::get("/api/v1/iran-map/provinces/{provinceCode}/schools", function ($provinceCode) {

    $db = Database::connect();

    $controller =
        new PartnerSchoolController($db);

    $controller->schools(
        $provinceCode
    );

});