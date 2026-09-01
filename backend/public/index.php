<?php

// Core
require_once __DIR__ . "/../app/Core/Database.php";
require_once __DIR__ . "/../app/Core/Request.php";
require_once __DIR__ . "/../app/Core/Response.php";
require_once __DIR__ . "/../app/Core/Router.php";


// Models
require_once __DIR__ . "/../app/Models/User.php";


// Services
require_once __DIR__ . "/../app/Services/AuthService.php";


// Controllers
require_once __DIR__ . "/../app/Controllers/AuthController.php";
require_once __DIR__ . "/../app/Models/Folder.php";
require_once __DIR__ . "/../app/Controllers/FolderController.php";
require_once __DIR__ . "/../app/Models/Word.php";
require_once __DIR__ . "/../app/Controllers/WordController.php";

// Middleware
require_once __DIR__ . "/../app/Middleware/AuthMiddleware.php";


// Routes
require_once __DIR__ . "/../routes/api.php";


// Run Router
Router::dispatch();