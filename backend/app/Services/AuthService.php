<?php

class AuthService
{
    private $userModel;
    private $db;


    public function __construct($db)
    {
        $this->db = $db;
        $this->userModel = new User($db);
    }


    public function register($data)
    {
        $existingUser = $this->userModel->findByUsername(
            $data["username"]
        );


        if ($existingUser) {
            throw new Exception(
                "Username already exists"
            );
        }


        if (!$this->validatePassword($data["password"])) {
            throw new Exception(
                "Password format is invalid"
            );
        }


        $userId = $this->uuid();


        $user = $this->userModel->create([
            "id" => $userId,
            "username" => $data["username"],
            "password" => password_hash(
                $data["password"],
                PASSWORD_DEFAULT
            ),
            "school_name" => $data["school_name"],
            "grade" => $data["grade"],
            "avatar" => $data["avatar"] ?? null
        ]);


        return $user;
    }



    public function login($username, $password)
    {
        $user = $this->userModel->findByUsername(
            $username
        );


        if (!$user) {
            throw new Exception(
                "Invalid username or password"
            );
        }


        if (!password_verify(
            $password,
            $user["password"]
        )) {
            throw new Exception(
                "Invalid username or password"
            );
        }


        $token = bin2hex(
            random_bytes(32)
        );


        $tokenId = $this->uuid();


        $query = $this->db->prepare(
            "INSERT INTO auth_tokens
            (
                id,
                user_id,
                token,
                expires_at
            )
            VALUES
            (
                :id,
                :user_id,
                :token,
                DATE_ADD(NOW(), INTERVAL 30 DAY)
            )"
        );


        $query->execute([
            "id" => $tokenId,
            "user_id" => $user["id"],
            "token" => $token
        ]);


        return [
            "token" => $token,
            "user" => [
                "id" => $user["id"],
                "username" => $user["username"],
                "schoolName" => $user["school_name"],
                "grade" => $user["grade"],
                "avatar" => $user["avatar"]
            ]
        ];
    }



    private function validatePassword($password)
    {
        return preg_match(
            '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/',
            $password
        );
    }



    private function uuid()
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 65535),
            mt_rand(0, 65535),
            mt_rand(0, 65535),
            mt_rand(16384, 20479),
            mt_rand(32768, 49151),
            mt_rand(0, 65535),
            mt_rand(0, 65535),
            mt_rand(0, 65535)
        );
    }
}