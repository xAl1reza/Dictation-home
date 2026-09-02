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
        $type = isset($_GET["type"])
            ? trim($_GET["type"])
            : null;


        if (
            $type !== null &&
            $type !== "" &&
            !in_array($type, ["dictation", "science"], true)
        ) {

            Response::error(
                "Invalid folder type",
                400
            );

            return;
        }


        if ($type === "") {
            $type = null;
        }


        $folders = $this->folderModel->getByUserId(
            $user["id"],
            $type
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


            $title = trim($data["title"] ?? "");
            $type = trim($data["type"] ?? "");


            if (
                $title === "" ||
                $type === ""
            ) {

                Response::error(
                    "Title and type are required",
                    400
                );

                return;
            }


            if (
                !in_array(
                    $type,
                    [
                        "dictation",
                        "science"
                    ],
                    true
                )
            ) {

                Response::error(
                    "Invalid folder type",
                    400
                );

                return;
            }


            $folder = $this->folderModel->create([
                "id" => $this->uuid(),
                "user_id" => $user["id"],
                "title" => $title,
                "type" => $type
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

            return;
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