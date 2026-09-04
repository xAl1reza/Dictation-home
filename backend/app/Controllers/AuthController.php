<?php

class AuthController
{
    private $authService;

    public function __construct($db)
    {
        $this->authService =
            new AuthService($db);
    }

    public function register()
    {
        try {

            $data =
                Request::body();

            $user =
                $this->authService
                    ->register(
                        $data
                    );

            Response::success(
                $user,
                "Register successful"
            );

        } catch (Exception $e) {

            $statusCode =
                $e->getMessage()
                    ===
                    "AUTH_NATIONAL_CODE_TAKEN"
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

            $data =
                Request::body();

            $result =
                $this->authService
                    ->login(
                        $data
                    );

            $token =
                (string)(
                    $result[
                        "token"
                    ]
                    ?? ""
                );

            $expiresInDays =
                (int)(
                    $result[
                        "expiresInDays"
                    ]
                    ?? 30
                );

            /*
             * Token is moved into an HttpOnly cookie.
             * It is deliberately removed from JSON so frontend JS
             * can never read or persist it.
             */
            AuthCookie::issue(
                $token,
                $expiresInDays
            );

            unset(
                $result[
                    "token"
                ]
            );

            Response::success(
                $result,
                "Login successful"
            );

        } catch (Exception $e) {

            $code =
                $e->getMessage();

            if (
                $code ===
                "AUTH_LOGIN_RATE_LIMITED"
            ) {
                Response::error(
                    "Too many login attempts. Try again later.",
                    429
                );

                return;
            }

            if (
                $code ===
                "AUTH_COOKIE_SET_FAILED" ||
                $code ===
                "AUTH_COOKIE_TOKEN_REQUIRED"
            ) {
                Response::error(
                    "Internal server error",
                    500
                );

                return;
            }

            $statusCode =
                $code ===
                "AUTH_LOGIN_INVALID"
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
        $token =
            AuthCookie::token();

        try {

            if ($token) {
                $this->authService
                    ->logout(
                        $token
                    );
            }

        } catch (Exception $e) {

            /*
             * Cookie still has to be removed from the browser
             * even if token revocation itself fails.
             */
            AuthCookie::clear();

            throw $e;
        }

        AuthCookie::clear();

        Response::success(
            [],
            "Logout successful"
        );
    }
}
