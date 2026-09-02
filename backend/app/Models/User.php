<?php

class User
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    public function findByNationalCode($nationalCode)
    {
        $query = $this->db->prepare(
            "SELECT *
             FROM users
             WHERE national_code = :national_code
             LIMIT 1"
        );

        $query->execute([
            "national_code" => $nationalCode
        ]);

        return $query->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    public function findById($id)
    {
        $query = $this->db->prepare(
            "SELECT
                id,
                national_code,
                first_name,
                last_name,
                mother_phone,
                father_phone,
                birth_date,
                school_name,
                grade,
                avatar
             FROM users
             WHERE id = :id
             LIMIT 1"
        );

        $query->execute([
            "id" => $id
        ]);

        return $query->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    public function create($data)
    {
        $query = $this->db->prepare(
            "INSERT INTO users (
                id,
                national_code,
                first_name,
                last_name,
                mother_phone,
                father_phone,
                birth_date,
                password,
                school_name,
                grade,
                avatar
            ) VALUES (
                :id,
                :national_code,
                :first_name,
                :last_name,
                :mother_phone,
                :father_phone,
                :birth_date,
                :password,
                :school_name,
                :grade,
                :avatar
            )"
        );

        $query->execute([
            "id" => $data["id"],
            "national_code" => $data["national_code"],
            "first_name" => $data["first_name"],
            "last_name" => $data["last_name"],
            "mother_phone" => $data["mother_phone"],
            "father_phone" => $data["father_phone"],
            "birth_date" => $data["birth_date"],
            "password" => $data["password"],
            "school_name" => $data["school_name"],
            "grade" => $data["grade"],
            "avatar" => $data["avatar"] ?? null
        ]);

        return $this->findById($data["id"]);
    }
}
