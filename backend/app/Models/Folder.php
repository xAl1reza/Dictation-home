<?php

class Folder
{
    private $db;


    public function __construct($db)
    {
        $this->db = $db;
    }



    public function getByUserId($userId)
    {
        $query = $this->db->prepare(
            "SELECT 
                id,
                title,
                type,
                created_at,
                updated_at
             FROM folders
             WHERE user_id = :user_id
             ORDER BY created_at DESC"
        );


        $query->execute([
            "user_id" => $userId
        ]);


        return $query->fetchAll(PDO::FETCH_ASSOC);
    }




    public function create($data)
    {
        $query = $this->db->prepare(
            "INSERT INTO folders
            (
                id,
                user_id,
                title,
                type
            )
            VALUES
            (
                :id,
                :user_id,
                :title,
                :type
            )"
        );


        $query->execute([
            "id" => $data["id"],
            "user_id" => $data["user_id"],
            "title" => $data["title"],
            "type" => $data["type"]
        ]);


        return [
            "id" => $data["id"],
            "title" => $data["title"],
            "type" => $data["type"]
        ];
    }




    public function findById($id, $userId)
    {
        $query = $this->db->prepare(
            "SELECT *
             FROM folders
             WHERE id = :id
             AND user_id = :user_id
             LIMIT 1"
        );


        $query->execute([
            "id" => $id,
            "user_id" => $userId
        ]);


        return $query->fetch(PDO::FETCH_ASSOC);
    }




    public function delete($id, $userId)
    {
        $query = $this->db->prepare(
            "DELETE FROM folders
             WHERE id = :id
             AND user_id = :user_id"
        );


        return $query->execute([
            "id" => $id,
            "user_id" => $userId
        ]);
    }
}