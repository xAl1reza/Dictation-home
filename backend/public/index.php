<?php

require_once __DIR__ . "/../app/Core/Database.php";
require_once __DIR__ . "/../app/Core/Request.php";
require_once __DIR__ . "/../app/Core/Response.php";
require_once __DIR__ . "/../app/Core/Router.php";


require_once __DIR__ . "/../routes/api.php";


Router::dispatch();