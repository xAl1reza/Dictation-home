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


        return [
            "id" => $data["id"],
            "score" => $data["score"],
            "accuracy" => $data["accuracy"]
        ];
    }




    public function getByUserId($userId)
    {
        $query = $this->db->prepare(
            "SELECT *
             FROM game_results
             WHERE user_id = :user_id
             ORDER BY created_at DESC"
        );


        $query->execute([
            "user_id" => $userId
        ]);


        return $query->fetchAll(PDO::FETCH_ASSOC);
    }
}