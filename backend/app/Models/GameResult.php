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
                session_id,
                user_id,
                folder_id,
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
                :session_id,
                :user_id,
                :folder_id,
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
            "session_id" => $data["session_id"],
            "user_id" => $data["user_id"],
            "folder_id" => $data["folder_id"],
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


        return $this->findBySessionIdAndUserId(
            $data["session_id"],
            $data["user_id"]
        );
    }


    public function findBySessionIdAndUserId($sessionId, $userId)
    {
        $query = $this->db->prepare(
            "SELECT
                gr.*,
                f.title AS folder_title
             FROM game_results gr
             LEFT JOIN folders f
                ON f.id = gr.folder_id
             WHERE gr.session_id = :session_id
             AND gr.user_id = :user_id
             LIMIT 1"
        );


        $query->execute([
            "session_id" => $sessionId,
            "user_id" => $userId
        ]);


        $result = $query->fetch(PDO::FETCH_ASSOC);


        return $result
            ? $this->formatResult($result)
            : null;
    }


    public function getByUserId($userId, $gameType = null)
    {
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


        $results = $query->fetchAll(PDO::FETCH_ASSOC);


        return array_map(
            [$this, "formatResult"],
            $results
        );
    }


    private function formatResult($row)
    {
        return [
            "id" => $row["id"],
            "sessionId" => $row["session_id"],
            "gameType" => $row["game_type"],
            "userId" => $row["user_id"],

            "score" => (int) $row["score"],
            "correct" => (int) $row["correct"],
            "wrong" => (int) $row["wrong"],
            "skipped" => (int) $row["skipped"],
            "answered" => (int) $row["answered"],
            "rounds" => (int) $row["rounds"],
            "accuracy" => (int) $row["accuracy"],
            "durationSeconds" => (int) $row["duration_seconds"],

            "startedAt" => $this->toIsoDate($row["started_at"]),
            "finishedAt" => $this->toIsoDate($row["finished_at"]),

            "folderId" => $row["folder_id"],
            "folderTitle" => $row["folder_title"] ?? null,

            "createdAt" => $this->toIsoDate(
                $row["created_at"] ?? null
            )
        ];
    }


    private function toIsoDate($value)
    {
        if (!$value) {
            return null;
        }


        $timestamp = strtotime($value);


        if ($timestamp === false) {
            return null;
        }


        return gmdate(
            "Y-m-d\\TH:i:s\\Z",
            $timestamp
        );
    }
}