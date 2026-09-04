<?php

class GameResult
{
    private $db;


    public function __construct($db)
    {
        $this->db = $db;
    }


    public function create($data)
    {
        $query = $this->db->prepare(
            "INSERT INTO game_results
            (
                id,
                user_id,
                folder_id,
                session_id,
                game_type,
                score,
                correct,
                wrong,
                skipped,
                answered,
                rounds,
                accuracy,
                duration_seconds,
                started_at,
                finished_at
            )
            VALUES
            (
                :id,
                :user_id,
                :folder_id,
                :session_id,
                :game_type,
                :score,
                :correct,
                :wrong,
                :skipped,
                :answered,
                :rounds,
                :accuracy,
                :duration_seconds,
                :started_at,
                :finished_at
            )"
        );

        $query->execute([
            "id" => $data["id"],
            "user_id" => $data["user_id"],
            "folder_id" => $data["folder_id"],
            "session_id" => $data["session_id"],
            "game_type" => $data["game_type"],
            "score" => $data["score"],
            "correct" => $data["correct"],
            "wrong" => $data["wrong"],
            "skipped" => $data["skipped"],
            "answered" => $data["answered"],
            "rounds" => $data["rounds"],
            "accuracy" => $data["accuracy"],
            "duration_seconds" => $data["duration_seconds"],
            "started_at" => $data["started_at"],
            "finished_at" => $data["finished_at"]
        ]);

        return $this->findByIdForUser(
            $data["id"],
            $data["user_id"]
        );
    }


    public function findByIdForUser($id, $userId)
    {
        $query = $this->db->prepare(
            "SELECT
                gr.*,
                f.title AS folder_title
             FROM game_results gr
             LEFT JOIN folders f
                ON f.id = gr.folder_id
             WHERE gr.id = :id
             AND gr.user_id = :user_id
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


    public function findByUserAndSession(
        $userId,
        $sessionId
    ) {
        $query = $this->db->prepare(
            "SELECT
                gr.*,
                f.title AS folder_title
             FROM game_results gr
             LEFT JOIN folders f
                ON f.id = gr.folder_id
             WHERE gr.user_id = :user_id
             AND gr.session_id = :session_id
             LIMIT 1"
        );

        $query->execute([
            "user_id" => $userId,
            "session_id" => $sessionId
        ]);

        return $query->fetch(
            PDO::FETCH_ASSOC
        ) ?: null;
    }


    public function getByUserId(
        $userId,
        $gameType = null
    ) {
        $sql = "
            SELECT
                gr.*,
                f.title AS folder_title
            FROM game_results gr
            LEFT JOIN folders f
                ON f.id = gr.folder_id
            WHERE gr.user_id = :user_id
        ";

        $params = [
            "user_id" => $userId
        ];

        if ($gameType !== null) {
            $sql .= " AND gr.game_type = :game_type";
            $params["game_type"] = $gameType;
        }

        $sql .= " ORDER BY gr.created_at DESC";

        $query = $this->db->prepare($sql);
        $query->execute($params);

        return $query->fetchAll(
            PDO::FETCH_ASSOC
        );
    }
}
