<?php

class Word
{
    private $db;


    public function __construct($db)
    {
        $this->db = $db;
    }



    public function getByFolderId($folderId)
    {
        $query = $this->db->prepare(
            "SELECT 
                id,
                word,
                description,
                created_at
             FROM words
             WHERE folder_id = :folder_id
             ORDER BY created_at DESC"
        );


        $query->execute([
            "folder_id" => $folderId
        ]);


        return $query->fetchAll(PDO::FETCH_ASSOC);
    }



    public function create($data)
    {
        $query = $this->db->prepare(
            "INSERT INTO words
            (
                id,
                folder_id,
                word,
                description
            )
            VALUES
            (
                :id,
                :folder_id,
                :word,
                :description
            )"
        );


        $query->execute([
            "id" => $data["id"],
            "folder_id" => $data["folder_id"],
            "word" => $data["word"],
            "description" => $data["description"]
        ]);


        return [
            "id" => $data["id"],
            "word" => $data["word"],
            "description" => $data["description"]
        ];
    }



    public function delete($id, $folderId)
    {
        $query = $this->db->prepare(
            "DELETE FROM words
             WHERE id = :id
             AND folder_id = :folder_id"
        );


        return $query->execute([
            "id" => $id,
            "folder_id" => $folderId
        ]);
    }
}