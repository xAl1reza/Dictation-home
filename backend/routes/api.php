<?php

Router::get("/api/v1/test", function () {

    Response::success(
        [],
        "API is working"
    );

});