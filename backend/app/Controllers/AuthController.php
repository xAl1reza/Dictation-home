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

            $code = $e->getMessage();

            if ($code === "AUTH_LOGIN_RATE_LIMITED") {
                Response::error(
                    "Too many login attempts. Try again later.",
                    429
                );

                return;
            }

            $statusCode =
                $code === "AUTH_LOGIN_INVALID"
                    ? 401
                    : 422;

            Response::error(
                $code,
                $statusCode
            );
        }
    }

    public function logout()
    {
        $authorization =
            Request::header("Authorization");

        if (
            !$authorization ||
            !str_starts_with(
                $authorization,
                "Bearer "
            )
        ) {

            Response::error(
                "Unauthorized",
                401
            );

            return;
        }

        $token = trim(
            substr(
                $authorization,
                7
            )
        );

        if ($token === "") {

            Response::error(
                "Unauthorized",
                401
            );

            return;
        }

        try {

            $this->authService->logout(
                $token
            );

            Response::success(
                [],
                "Logout successful"
            );

        } catch (Exception $e) {

            Response::error(
                "Logout failed",
                400
            );
        }
    }
}
