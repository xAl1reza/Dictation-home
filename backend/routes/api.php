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


Router::post("/api/v1/auth/logout", function () {

    $db = Database::connect();

    /*
     * Logout is intentionally idempotent.
     * The controller revokes the current token when present
     * and always clears the browser auth cookie.
     */
    $controller = new AuthController($db);

    $controller->logout();

});



/*
|--------------------------------------------------------------------------
| User / Profile Routes
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


Router::patch("/api/v1/profile", function () {

    $db = Database::connect();

    $auth = new AuthMiddleware($db);

    $user = $auth->handle();


    $controller = new ProfileController($db);

    $controller->update($user);

});


Router::patch("/api/v1/profile/password", function () {

    $db = Database::connect();

    $auth = new AuthMiddleware($db);

    $user = $auth->handle();


    $controller = new ProfileController($db);

    $controller->changePassword($user);

});


Router::post("/api/v1/profile/avatar", function () {

    $db = Database::connect();

    $auth = new AuthMiddleware($db);

    $user = $auth->handle();


    $controller = new ProfileController($db);

    $controller->uploadAvatar($user);

});


Router::delete("/api/v1/profile/avatar", function () {

    $db = Database::connect();

    $auth = new AuthMiddleware($db);

    $user = $auth->handle();


    $controller = new ProfileController($db);

    $controller->deleteAvatar($user);

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


Router::patch("/api/v1/folders/{id}", function ($id) {

    $db = Database::connect();

    $auth = new AuthMiddleware($db);

    $user = $auth->handle();


    $controller = new FolderController($db);

    $controller->update(
        $user,
        $id
    );

});


Router::delete("/api/v1/folders/{id}", function ($id) {

    $db = Database::connect();

    $auth = new AuthMiddleware($db);

    $user = $auth->handle();


    $controller = new FolderController($db);

    $controller->destroy(
        $user,
        $id
    );

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


Router::patch("/api/v1/words/{id}", function ($id) {

    $db = Database::connect();

    $auth = new AuthMiddleware($db);

    $user = $auth->handle();


    $controller = new WordController($db);

    $controller->update(
        $user,
        $id
    );

});


Router::delete("/api/v1/words/{id}", function ($id) {

    $db = Database::connect();

    $auth = new AuthMiddleware($db);

    $user = $auth->handle();


    $controller = new WordController($db);

    $controller->destroy(
        $user,
        $id
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


Router::patch("/api/v1/science-questions/{id}", function ($id) {

    $db = Database::connect();

    $auth = new AuthMiddleware($db);

    $user = $auth->handle();


    $controller = new ScienceQuestionController($db);

    $controller->update(
        $user,
        $id
    );

});


Router::delete("/api/v1/science-questions/{id}", function ($id) {

    $db = Database::connect();

    $auth = new AuthMiddleware($db);

    $user = $auth->handle();


    $controller = new ScienceQuestionController($db);

    $controller->destroy(
        $user,
        $id
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
