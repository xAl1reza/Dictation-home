<?php

class WordController
{
    private $wordModel;


    public function __construct($db)
    {
        $this->wordModel = new Word($db);
    }



    public function index($folderId)
    {
        $words = $this->wordModel->getByFolderId(
            $folderId
        );


        Response::success(
            $words,
            "Words fetched successfully"
        );
    }



    public function store($folderId)
    {
        $data = Request::body();


        if (empty($data["word"])) {

            Response::error(
                "Word is required",
                400
            );

        }


        $word = $this->wordModel->create([
            "id" => $this->uuid(),
            "folder_id" => $folderId,
            "word" => $data["word"],
            "description" => $data["description"] ?? null
        ]);


        Response::success(
            $word,
            "Word created successfully"
        );
    }



    public function destroy($id, $folderId)
    {
        $this->wordModel->delete(
            $id,
            $folderId
        );


        Response::success(
            [],
            "Word deleted successfully"
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