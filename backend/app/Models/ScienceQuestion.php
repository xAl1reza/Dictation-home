<?php

class ScienceQuestion
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
                question,
                answer,
                created_at
             FROM science_questions
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
                question,
                answer,
                created_at
             FROM science_questions
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
            "INSERT INTO science_questions
            (
                id,
                folder_id,
                question,
                answer
            )
            VALUES
            (
                :id,
                :folder_id,
                :question,
                :answer
            )"
        );

        $query->execute([
            "id" => $data["id"],
            "folder_id" => $data["folder_id"],
            "question" => $data["question"],
            "answer" => $data["answer"]
        ]);

        return $this->findById(
            $data["id"]
        );
    }


    public function update(
        $id,
        $folderId,
        $question,
        $answer
    ) {
        $query = $this->db->prepare(
            "UPDATE science_questions
             SET
                question = :question,
                answer = :answer
             WHERE id = :id
             AND folder_id = :folder_id"
        );

        $query->execute([
            "id" => $id,
            "folder_id" => $folderId,
            "question" => $question,
            "answer" => $answer
        ]);

        return $this->findById($id);
    }


    public function existsInFolder(
        $folderId,
        $question,
        $exceptId = null
    ) {
        $sql = "
            SELECT id
            FROM science_questions
            WHERE folder_id = :folder_id
            AND LOWER(TRIM(question)) =
                LOWER(TRIM(:question))
        ";

        $params = [
            "folder_id" => $folderId,
            "question" => $question
        ];

        if ($exceptId !== null) {
            $sql .= " AND id != :except_id";
            $params["except_id"] = $exceptId;
        }

        $sql .= " LIMIT 1";

        $query = $this->db->prepare($sql);
        $query->execute($params);

        return (bool) $query->fetchColumn();
    }


    public function delete($id, $folderId)
    {
        $query = $this->db->prepare(
            "DELETE FROM science_questions
             WHERE id = :id
             AND folder_id = :folder_id"
        );

        return $query->execute([
            "id" => $id,
            "folder_id" => $folderId
        ]);
    }
}
