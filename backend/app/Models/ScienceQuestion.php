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
                created_at,
                updated_at
             FROM science_questions
             WHERE folder_id = :folder_id
             ORDER BY created_at ASC"
        );


        $query->execute([
            "folder_id" => $folderId
        ]);


        $rows = $query->fetchAll(
            PDO::FETCH_ASSOC
        );


        return array_map(
            [$this, "formatQuestion"],
            $rows
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
                created_at,
                updated_at
             FROM science_questions
             WHERE id = :id
             LIMIT 1"
        );


        $query->execute([
            "id" => $id
        ]);


        $row = $query->fetch(
            PDO::FETCH_ASSOC
        );


        return $row
            ? $this->formatQuestion($row)
            : null;
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
        $question,
        $answer
    ) {

        $query = $this->db->prepare(
            "UPDATE science_questions
             SET
                question = :question,
                answer = :answer
             WHERE id = :id"
        );


        $query->execute([
            "id" => $id,
            "question" => $question,
            "answer" => $answer
        ]);


        return $this->findById($id);
    }


    public function delete($id)
    {
        $query = $this->db->prepare(
            "DELETE FROM science_questions
             WHERE id = :id"
        );


        return $query->execute([
            "id" => $id
        ]);
    }


    public function questionExistsInFolder(
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


    private function formatQuestion($row)
    {
        return [
            "id" => $row["id"],
            "folderId" => $row["folder_id"],
            "question" => $row["question"],
            "answer" => $row["answer"],
            "createdAt" => $row["created_at"],
            "updatedAt" => $row["updated_at"]
        ];
    }
}