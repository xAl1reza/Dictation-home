<?php

class Folder
{
    private $db;


    public function __construct($db)
    {
        $this->db = $db;
    }


    /**
     * Return:
     * - all personal folders owned by the user
     * - the two system folders matching the user's grade
     */
    public function getByUserId(
        $userId,
        $grade,
        $type = null
    ) {
        $grade = $this->normalizeGrade($grade);

        $sql = "
            SELECT
                f.id,
                f.user_id,
                f.title,
                f.type,
                f.grade,
                f.created_at AS createdAt,
                f.updated_at AS updatedAt,

                (
                    SELECT COUNT(*)
                    FROM words w
                    WHERE w.folder_id = f.id
                ) AS wordCount,

                (
                    SELECT COUNT(*)
                    FROM science_questions sq
                    WHERE sq.folder_id = f.id
                ) AS questionCount

            FROM folders f

            WHERE
                f.user_id = :user_id
        ";

        $params = [
            "user_id" => $userId
        ];

        if ($grade !== null) {
            $sql .= "
                OR (
                    f.user_id IS NULL
                    AND f.grade = :grade
                )
            ";

            $params["grade"] = $grade;
        }

        $sql = "SELECT * FROM (" . $sql . ") visible_folders WHERE 1 = 1";

        if ($type !== null) {
            $sql .= " AND visible_folders.type = :type";
            $params["type"] = $type;
        }

        $sql .= "
            ORDER BY
                CASE
                    WHEN visible_folders.user_id IS NULL THEN 0
                    ELSE 1
                END ASC,
                visible_folders.createdAt DESC
        ";

        $query = $this->db->prepare($sql);
        $query->execute($params);

        $folders = $query->fetchAll(
            PDO::FETCH_ASSOC
        );

        return array_map(
            [$this, "formatFolder"],
            $folders
        );
    }


    public function create($data)
    {
        $query = $this->db->prepare(
            "INSERT INTO folders
            (
                id,
                user_id,
                title,
                type,
                grade
            )
            VALUES
            (
                :id,
                :user_id,
                :title,
                :type,
                NULL
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
            "grade" => null,
            "ownerType" => "user",
            "locked" => false,
            "wordCount" => 0,
            "questionCount" => 0
        ];
    }


    /**
     * Strict personal ownership lookup.
     * Use this for every mutation.
     */
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

        return $query->fetch(
            PDO::FETCH_ASSOC
        ) ?: null;
    }


    /**
     * Read/play access lookup.
     * A user may access:
     * - their own folder, or
     * - a system folder for exactly their grade.
     */
    public function findAccessibleById(
        $id,
        $userId,
        $grade
    ) {
        $grade = $this->normalizeGrade($grade);

        $sql = "
            SELECT *
            FROM folders
            WHERE id = :id
            AND (
                user_id = :user_id
        ";

        $params = [
            "id" => $id,
            "user_id" => $userId
        ];

        if ($grade !== null) {
            $sql .= "
                OR (
                    user_id IS NULL
                    AND grade = :grade
                )
            ";

            $params["grade"] = $grade;
        }

        $sql .= ") LIMIT 1";

        $query = $this->db->prepare($sql);
        $query->execute($params);

        return $query->fetch(
            PDO::FETCH_ASSOC
        ) ?: null;
    }


    public function updateTitle(
        $id,
        $userId,
        $title
    ) {
        $query = $this->db->prepare(
            "UPDATE folders
             SET title = :title
             WHERE id = :id
             AND user_id = :user_id"
        );

        $query->execute([
            "id" => $id,
            "user_id" => $userId,
            "title" => $title
        ]);

        return $this->findById(
            $id,
            $userId
        );
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


    private function formatFolder($folder)
    {
        $isSystem = $folder["user_id"] === null;

        return [
            "id" => $folder["id"],
            "title" => $folder["title"],
            "type" => $folder["type"],
            "grade" => $folder["grade"] === null
                ? null
                : (int) $folder["grade"],

            "ownerType" => $isSystem
                ? "system"
                : "user",

            "locked" => $isSystem,

            "wordCount" =>
                (int) $folder["wordCount"],

            "questionCount" =>
                (int) $folder["questionCount"],

            "createdAt" =>
                $folder["createdAt"] ?? null,

            "updatedAt" =>
                $folder["updatedAt"] ?? null
        ];
    }


    private function normalizeGrade($grade)
    {
        if (!is_numeric($grade)) {
            return null;
        }

        $grade = (int) $grade;

        return ($grade >= 1 && $grade <= 6)
            ? $grade
            : null;
    }
}
