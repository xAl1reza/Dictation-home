<?php

class Folder
{
    private $db;


    public function __construct($db)
    {
        $this->db = $db;
    }


    public function getByUserId($userId, $type = null)
    {
        $sql = "
            SELECT
                f.id,
                f.title,
                f.type,
                f.created_at AS createdAt,
                f.updated_at AS updatedAt,

                (
                    SELECT COUNT(*)
                    FROM words w
                    WHERE w.folder_id = f.id
                ) AS wordCount

            FROM folders f

            WHERE f.user_id = :user_id
        ";


        $params = [
            "user_id" => $userId
        ];


        if ($type !== null) {

            $sql .= " AND f.type = :type";

            $params["type"] = $type;
        }


        $sql .= " ORDER BY f.created_at DESC";


        $query = $this->db->prepare($sql);

        $query->execute($params);


        $folders = $query->fetchAll(PDO::FETCH_ASSOC);


        return array_map(function ($folder) {

            return [
                "id" => $folder["id"],
                "title" => $folder["title"],
                "type" => $folder["type"],

                "ownerType" => "user",
                "locked" => false,

                "wordCount" => (int) $folder["wordCount"],

                // Science API is implemented in the next stage.
                "questionCount" => 0,

                "createdAt" => $folder["createdAt"],
                "updatedAt" => $folder["updatedAt"]
            ];

        }, $folders);
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
            "type" => $data["type"],

            "ownerType" => "user",
            "locked" => false,

            "wordCount" => 0,
            "questionCount" => 0
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