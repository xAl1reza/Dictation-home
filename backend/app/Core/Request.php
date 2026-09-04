<?php

class Request
{
    public static function body()
    {
        $rawBody = file_get_contents(
            "php://input"
        );

        if (
            $rawBody === false ||
            trim($rawBody) === ""
        ) {
            return [];
        }

        $data = json_decode(
            $rawBody,
            true
        );

        return is_array($data)
            ? $data
            : [];
    }

    public static function header($name)
    {
        $name = trim(
            (string)$name
        );

        if ($name === "") {
            return null;
        }

        /*
         * Authorization needs special handling on Apache/PHP.
         * Depending on the SAPI/rewrite path it may be exposed as
         * HTTP_AUTHORIZATION or REDIRECT_HTTP_AUTHORIZATION.
         */
        if (
            strcasecmp(
                $name,
                "Authorization"
            ) === 0
        ) {

            $authorization =
                $_SERVER["HTTP_AUTHORIZATION"]
                ?? $_SERVER["REDIRECT_HTTP_AUTHORIZATION"]
                ?? null;

            if (
                is_string($authorization) &&
                trim($authorization) !== ""
            ) {
                return trim(
                    $authorization
                );
            }
        }

        /*
         * Header names are case-insensitive by HTTP specification.
         * Do not assume browsers preserve "Authorization" casing.
         */
        if (function_exists("getallheaders")) {

            $headers = getallheaders();

            if (is_array($headers)) {

                foreach (
                    $headers
                    as $headerName => $value
                ) {

                    if (
                        strcasecmp(
                            (string)$headerName,
                            $name
                        ) === 0
                    ) {
                        return is_string($value)
                            ? trim($value)
                            : $value;
                    }
                }
            }
        }

        $serverKey =
            "HTTP_" .
            strtoupper(
                str_replace(
                    "-",
                    "_",
                    $name
                )
            );

        if (
            isset($_SERVER[$serverKey]) &&
            $_SERVER[$serverKey] !== ""
        ) {
            return trim(
                (string)$_SERVER[$serverKey]
            );
        }

        return null;
    }
}
