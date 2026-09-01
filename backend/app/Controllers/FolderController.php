<?php

class FolderController
{
    private $folderModel;


    public function __construct($db)
    {
        $this->folderModel = new Folder($db);
    }



    public function index($user)
    {
        $folders = $this->folderModel->getByUserId(
            $user["id"]
        );


        Response::success(
            $folders,
            "Folders fetched successfully"
        );
    }




    public function store($user)
    {
        try {

            $data = Request::body();


            if (
                empty($data["title"]) ||
                empty($data["type"])
            ) {

                Response::error(
                    "Title and type are required",
                    400
                );

            }



            if (
                !in_array(
                    $data["type"],
                    [
                        "dictation",
                        "science"
                    ]
                )
            ) {

                Response::error(
                    "Invalid folder type",
                    400
                );

            }



            $folder = $this->folderModel->create([
                "id" => $this->uuid(),
                "user_id" => $user["id"],
                "title" => $data["title"],
                "type" => $data["type"]
            ]);



            Response::success(
                $folder,
                "Folder created successfully"
            );


        } catch (Exception $e) {

            Response::error(
                $e->getMessage(),
                400
            );

        }
    }





    public function destroy($user, $id)
    {
        $folder = $this->folderModel->findById(
            $id,
            $user["id"]
        );


        if (!$folder) {

            Response::error(
                "Folder not found",
                404
            );

        }


        $this->folderModel->delete(
            $id,
            $user["id"]
        );


        Response::success(
            [],
            "Folder deleted successfully"
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