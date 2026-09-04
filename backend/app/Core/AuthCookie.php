<?php

class AuthCookie
{
    private const COOKIE_NAME =
        "dikteh_khooneh_session";

    private const DEFAULT_SAME_SITE =
        "Lax";

    public static function issue(
        $token,
        $expiresInDays = 30
    ) {
        $token = trim(
            (string)$token
        );

        $expiresInDays =
            max(
                1,
                (int)$expiresInDays
            );

        if ($token === "") {
            throw new Exception(
                "AUTH_COOKIE_TOKEN_REQUIRED"
            );
        }

        $success = setcookie(
            self::COOKIE_NAME,
            $token,
            [
                "expires" =>
                    time() +
                    (
                        $expiresInDays *
                        86400
                    ),

                "path" =>
                    self::cookiePath(),

                "secure" =>
                    self::isSecure(),

                "httponly" =>
                    true,

                "samesite" =>
                    self::sameSite()
            ]
        );

        if (!$success) {
            throw new Exception(
                "AUTH_COOKIE_SET_FAILED"
            );
        }
    }

    public static function clear()
    {
        setcookie(
            self::COOKIE_NAME,
            "",
            [
                "expires" =>
                    time() - 3600,

                "path" =>
                    self::cookiePath(),

                "secure" =>
                    self::isSecure(),

                "httponly" =>
                    true,

                "samesite" =>
                    self::sameSite()
            ]
        );

        unset(
            $_COOKIE[
                self::COOKIE_NAME
            ]
        );
    }

    public static function token()
    {
        $cookieToken =
            trim(
                (string)(
                    $_COOKIE[
                        self::COOKIE_NAME
                    ]
                    ?? ""
                )
            );

        if ($cookieToken !== "") {
            return $cookieToken;
        }

        /*
         * Temporary backward-compatible fallback.
         *
         * Frontend no longer sends Bearer tokens.
         * This fallback only prevents existing Postman/testing
         * workflows from breaking during migration.
         * It can be removed in the final security cleanup.
         */
        $authorization =
            Request::header(
                "Authorization"
            );

        if (
            !$authorization ||
            !str_starts_with(
                $authorization,
                "Bearer "
            )
        ) {
            return null;
        }

        $bearerToken =
            trim(
                substr(
                    $authorization,
                    7
                )
            );

        return
            $bearerToken !== ""
                ? $bearerToken
                : null;
    }

    public static function name()
    {
        return self::COOKIE_NAME;
    }

    private static function cookiePath()
    {
        $configuredPath =
            getenv(
                "APP_AUTH_COOKIE_PATH"
            );

        if (
            is_string(
                $configuredPath
            ) &&
            trim(
                $configuredPath
            ) !== ""
        ) {
            $path =
                trim(
                    $configuredPath
                );

            return
                str_starts_with(
                    $path,
                    "/"
                )
                    ? $path
                    : "/" . $path;
        }

        /*
         * Local XAMPP:
         * /dictation-home/backend/public/index.php
         * becomes:
         * /dictation-home/backend/public
         *
         * This keeps the cookie away from the frontend server
         * even though frontend/backend use the same hostname
         * on different ports.
         */
        $scriptName =
            (string)(
                $_SERVER[
                    "SCRIPT_NAME"
                ]
                ?? "/"
            );

        $directory =
            str_replace(
                "\\",
                "/",
                dirname(
                    $scriptName
                )
            );

        if (
            $directory === "." ||
            $directory === "/" ||
            $directory === "\\"
        ) {
            return "/";
        }

        return
            "/" .
            trim(
                $directory,
                "/"
            );
    }

    private static function isSecure()
    {
        $configured =
            getenv(
                "APP_AUTH_COOKIE_SECURE"
            );

        if (
            $configured !== false &&
            trim(
                (string)$configured
            ) !== ""
        ) {
            return filter_var(
                $configured,
                FILTER_VALIDATE_BOOLEAN
            );
        }

        $https =
            $_SERVER["HTTPS"]
            ?? "";

        return
            $https !== "" &&
            strtolower(
                (string)$https
            ) !== "off";
    }

    private static function sameSite()
    {
        $configured =
            trim(
                (string)(
                    getenv(
                        "APP_AUTH_COOKIE_SAMESITE"
                    )
                    ?: self::DEFAULT_SAME_SITE
                )
            );

        $allowed = [
            "Lax",
            "Strict",
            "None"
        ];

        foreach (
            $allowed
            as $value
        ) {
            if (
                strcasecmp(
                    $configured,
                    $value
                ) === 0
            ) {
                /*
                 * Browsers require SameSite=None cookies
                 * to also be Secure.
                 */
                if (
                    $value === "None" &&
                    !self::isSecure()
                ) {
                    return
                        self::DEFAULT_SAME_SITE;
                }

                return $value;
            }
        }

        return
            self::DEFAULT_SAME_SITE;
    }
}
