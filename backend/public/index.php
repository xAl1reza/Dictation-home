<?php

/*
|--------------------------------------------------------------------------
| Basic Runtime Security
|--------------------------------------------------------------------------
*/

ini_set("display_errors", "0");
ini_set("display_startup_errors", "0");
ini_set("log_errors", "1");

error_reporting(E_ALL);


/*
|--------------------------------------------------------------------------
| API Security Headers
|--------------------------------------------------------------------------
*/

header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");
header("Referrer-Policy: no-referrer");
header("Permissions-Policy: camera=(), microphone=(), geolocation=()");
header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'");


/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
|
| Local development origins are allowed by default.
| On production set APP_ALLOWED_ORIGINS as a comma-separated list, e.g.
|
| https://example.com,https://www.example.com
|
*/

$defaultAllowedOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost",
    "http://127.0.0.1"
];


$configuredOrigins = getenv(
    "APP_ALLOWED_ORIGINS"
);


$allowedOrigins =
    $configuredOrigins
        ? array_values(
            array_filter(
                array_map(
                    "trim",
                    explode(
                        ",",
                        $configuredOrigins
                    )
                )
            )
        )
        : $defaultAllowedOrigins;


$requestOrigin =
    $_SERVER["HTTP_ORIGIN"] ?? null;


if (
    $requestOrigin &&
    in_array(
        $requestOrigin,
        $allowedOrigins,
        true
    )
) {

    header(
        "Access-Control-Allow-Origin: " .
        $requestOrigin
    );

    header("Vary: Origin");
}


header(
    "Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS"
);

header(
    "Access-Control-Allow-Headers: Content-Type, Authorization"
);

header(
    "Access-Control-Max-Age: 600"
);


/*
|--------------------------------------------------------------------------
| CORS Preflight
|--------------------------------------------------------------------------
*/

if (
    ($_SERVER["REQUEST_METHOD"] ?? "GET")
    === "OPTIONS"
) {

    http_response_code(204);
    exit;
}


/*
|--------------------------------------------------------------------------
| Core
|--------------------------------------------------------------------------
*/

require_once __DIR__ . "/../app/Core/Database.php";
require_once __DIR__ . "/../app/Core/Request.php";
require_once __DIR__ . "/../app/Core/Response.php";
require_once __DIR__ . "/../app/Core/Router.php";


/*
|--------------------------------------------------------------------------
| Global Exception Handler
|--------------------------------------------------------------------------
*/

set_exception_handler(
    function (Throwable $exception) {

        error_log(
            sprintf(
                "[API] %s in %s:%d\n%s",
                $exception->getMessage(),
                $exception->getFile(),
                $exception->getLine(),
                $exception->getTraceAsString()
            )
        );


        Response::error(
            "Internal server error",
            500
        );
    }
);


// Models
require_once __DIR__ . "/../app/Models/User.php";
require_once __DIR__ . "/../app/Models/Folder.php";
require_once __DIR__ . "/../app/Models/Word.php";
require_once __DIR__ . "/../app/Models/GameResult.php";
require_once __DIR__ . "/../app/Models/Dashboard.php";
require_once __DIR__ . "/../app/Models/ScienceQuestion.php";
require_once __DIR__ . "/../app/Models/News.php";
require_once __DIR__ . "/../app/Models/PartnerSchool.php";


// Services
require_once __DIR__ . "/../app/Services/AuthService.php";


// Middleware
require_once __DIR__ . "/../app/Middleware/AuthMiddleware.php";


// Controllers
require_once __DIR__ . "/../app/Controllers/AuthController.php";
require_once __DIR__ . "/../app/Controllers/FolderController.php";
require_once __DIR__ . "/../app/Controllers/WordController.php";
require_once __DIR__ . "/../app/Controllers/GameResultController.php";
require_once __DIR__ . "/../app/Controllers/DashboardController.php";
require_once __DIR__ . "/../app/Controllers/ScienceQuestionController.php";
require_once __DIR__ . "/../app/Controllers/NewsController.php";
require_once __DIR__ . "/../app/Controllers/PartnerSchoolController.php";


// Routes
require_once __DIR__ . "/../routes/api.php";


// Run Router
Router::dispatch();