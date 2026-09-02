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
        $authorization = Request::header("Authorization");

        if (
            !$authorization ||
            !str_starts_with($authorization, "Bearer ")
        ) {
            Response::error(
                "Unauthorized",
                401
            );
        }

        $token = trim(
            substr($authorization, 7)
        );

        if ($token === "") {
            Response::error(
                "Unauthorized",
                401
            );
        }

        $query = $this->db->prepare(
            "SELECT
                u.id,
                u.national_code,
                u.first_name,
                u.last_name,
                u.mother_phone,
                u.father_phone,
                u.birth_date,
                u.school_name,
                u.grade,
                u.avatar
             FROM auth_tokens t
             INNER JOIN users u
                ON u.id = t.user_id
             WHERE t.token = :token
               AND t.expires_at > NOW()
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

        return [
            "id" => $user["id"],
            "nationalCode" => $user["national_code"],
            "firstName" => $user["first_name"],
            "lastName" => $user["last_name"],

            // Used everywhere in the UI
            "name" => $user["first_name"],

            "motherPhone" => $user["mother_phone"],
            "fatherPhone" => $user["father_phone"],
            "birthDate" => $user["birth_date"],
            "schoolName" => $user["school_name"],
            "grade" => (int)$user["grade"],
            "avatar" => $user["avatar"] ?? null
        ];
    }
}
