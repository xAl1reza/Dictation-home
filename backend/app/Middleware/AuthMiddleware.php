<?php

class AuthMiddleware
{
    private $db;


    public function __construct($db)
    {
        $this->db = $db;
    }



    public function handle()
    {
        $header = Request::header("Authorization");


        if (!$header) {
            Response::error(
                "Unauthorized",
                401
            );
        }


        if (!str_starts_with($header, "Bearer ")) {

            Response::error(
                "Invalid authorization format",
                401
            );

        }


        $token = str_replace(
            "Bearer ",
            "",
            $header
        );


        $query = $this->db->prepare(
            "SELECT 
                users.id,
                users.username,
                users.school_name,
                users.grade,
                users.avatar
            FROM auth_tokens
            INNER JOIN users 
                ON users.id = auth_tokens.user_id
            WHERE auth_tokens.token = :token
            AND auth_tokens.expires_at > NOW()
            LIMIT 1"
        );


        $query->execute([
            "token" => $token
        ]);


        $user = $query->fetch(PDO::FETCH_ASSOC);


        if (!$user) {

            Response::error(
                "Invalid or expired token",
                401
            );

        }


        return $user;
    }
}