<?php

class GameResultController
{
    private $gameResultModel;


    public function __construct($db)
    {
        $this->gameResultModel = new GameResult($db);
    }



    public function store($user)
    {
        $data = Request::body();


        $result = $this->gameResultModel->create([
            "id" => $this->uuid(),

            "user_id" => $user["id"],

            "folder_id" => $data["folderId"] ?? null,

            "game_type" => $data["gameType"],

            "score" => $data["score"] ?? 0,

            "correct" => $data["correct"] ?? 0,

            "wrong" => $data["wrong"] ?? 0,

            "skipped" => $data["skipped"] ?? 0,

            "answered" => $data["answered"] ?? 0,

            "rounds" => $data["rounds"] ?? 0,

            "accuracy" => $data["accuracy"] ?? 0,

            "duration_seconds" => $data["durationSeconds"] ?? 0,

            "started_at" => $data["startedAt"] ?? null,

            "finished_at" => $data["finishedAt"] ?? null
        ]);


        Response::success(
            $result,
            "Game result saved successfully"
        );
    }



    public function history($user)
    {
        $results = $this->gameResultModel->getByUserId(
            $user["id"]
        );


        Response::success(
            $results,
            "Game history fetched successfully"
        );
    }



    private function uuid()
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 65535),
            mt_rand(0, 65535),
            mt_rand(0, 65535),
            mt_rand(16384, 20479),
            mt_rand(32768, 49151),
            mt_rand(0, 65535),
            mt_rand(0, 65535),
            mt_rand(0, 65535)
        );
    }
}