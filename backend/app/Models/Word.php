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
                folder_id,
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


        return $query->fetchAll(
            PDO::FETCH_ASSOC
        );
    }


    public function findById($id)
    {
        $query = $this->db->prepare(
            "SELECT
                id,
                folder_id,
                word,
                description,
                created_at
             FROM words
             WHERE id = :id
             LIMIT 1"
        );


        $query->execute([
            "id" => $id
        ]);


        return $query->fetch(
            PDO::FETCH_ASSOC
        ) ?: null;
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


        return $this->findById(
            $data["id"]
        );
    }


    public function updateValue(
        $id,
        $folderId,
        $word
    ) {

        $query = $this->db->prepare(
            "UPDATE words
             SET word = :word
             WHERE id = :id
             AND folder_id = :folder_id"
        );


        $query->execute([
            "id" => $id,
            "folder_id" => $folderId,
            "word" => $word
        ]);


        return $this->findById($id);
    }


    public function existsInFolder(
        $folderId,
        $word,
        $exceptId = null
    ) {

        $sql = "
            SELECT id
            FROM words
            WHERE folder_id = :folder_id
            AND LOWER(TRIM(word)) =
                LOWER(TRIM(:word))
        ";


        $params = [
            "folder_id" => $folderId,
            "word" => $word
        ];


        if ($exceptId !== null) {

            $sql .= " AND id != :except_id";

            $params["except_id"] =
                $exceptId;
        }


        $sql .= " LIMIT 1";


        $query = $this->db->prepare($sql);

        $query->execute($params);


        return (bool) $query->fetchColumn();
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