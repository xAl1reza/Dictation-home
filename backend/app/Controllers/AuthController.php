<?php

class AuthController
{
    private $authService;


    public function __construct($db)
    {
        $this->authService = new AuthService($db);
    }



    public function register()
    {
        try {

            $data = Request::body();


            $user = $this->authService->register([
                "username" => $data["username"],
                "password" => $data["password"],
                "school_name" => $data["schoolName"],
                "grade" => $data["grade"],
                "avatar" => $data["avatar"] ?? null
            ]);


            Response::success(
                $user,
                "Register successful"
            );


        } catch (Exception $e) {


            Response::error(
                $e->getMessage(),
                400
            );

        }
    }



    public function login()
    {
        try {

            $data = Request::body();


            $result = $this->authService->login(
                $data["username"],
                $data["password"]
            );


            Response::success(
                $result,
                "Login successful"
            );


        } catch (Exception $e) {


            Response::error(
                $e->getMessage(),
                401
            );

        }
    }
}