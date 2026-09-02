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

            $user = $this->authService->register($data);

            Response::success(
                $user,
                "Register successful"
            );

        } catch (Exception $e) {

            $statusCode =
                $e->getMessage() === "AUTH_NATIONAL_CODE_TAKEN"
                    ? 409
                    : 422;

            Response::error(
                $e->getMessage(),
                $statusCode
            );
        }
    }

    public function login()
    {
        try {
            $data = Request::body();

            $result = $this->authService->login($data);

            Response::success(
                $result,
                "Login successful"
            );

        } catch (Exception $e) {

            $statusCode =
                $e->getMessage() === "AUTH_LOGIN_INVALID"
                    ? 401
                    : 422;

            Response::error(
                $e->getMessage(),
                $statusCode
            );
        }
    }
}
