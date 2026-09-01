<?php

class User
{
    private $db;


    public function __construct($db)
    {
        $this->db = $db;
    }


    public function findByUsername($username)
    {
        $query = $this->db->prepare(
            "SELECT * FROM users WHERE username = :username LIMIT 1"
        );

        $query->execute([
            "username" => $username
        ]);

        return $query->fetch(PDO::FETCH_ASSOC);
    }


    public function findById($id)
    {
        $query = $this->db->prepare(
            "SELECT id, username, school_name, grade, avatar 
             FROM users 
             WHERE id = :id 
             LIMIT 1"
        );

        $query->execute([
            "id" => $id
        ]);

        return $query->fetch(PDO::FETCH_ASSOC);
    }


    public function create($data)
    {
        $query = $this->db->prepare(
            "INSERT INTO users 
            (
                id,
                username,
                password,
                school_name,
                grade,
                avatar
            )
            VALUES
            (
                :id,
                :username,
                :password,
                :school_name,
                :grade,
                :avatar
            )"
        );


        $query->execute([
            "id" => $data["id"],
            "username" => $data["username"],
            "password" => $data["password"],
            "school_name" => $data["school_name"],
            "grade" => $data["grade"],
            "avatar" => $data["avatar"]
        ]);


        return $this->findById($data["id"]);
    }
}