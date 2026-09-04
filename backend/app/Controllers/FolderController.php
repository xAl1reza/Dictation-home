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
            !in_array(
                $type,
                ["dictation", "science"],
                true
            )
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
            $user["grade"] ?? null,
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

            $title = trim(
                (string) ($data["title"] ?? "")
            );

            $type = trim(
                (string) ($data["type"] ?? "")
            );

            if ($title === "" || $type === "") {
                Response::error(
                    "Title and type are required",
                    400
                );

                return;
            }

            if (mb_strlen($title) > 100) {
                Response::error(
                    "Title must not exceed 100 characters",
                    400
                );

                return;
            }

            if (
                !in_array(
                    $type,
                    ["dictation", "science"],
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
                "Folder could not be created",
                400
            );
        }
    }


    public function update($user, $id)
    {
        // Strict ownership deliberately excludes system folders.
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

        $data = Request::body();

        $title = trim(
            (string) ($data["title"] ?? "")
        );

        if ($title === "") {
            Response::error(
                "Title is required",
                400
            );

            return;
        }

        if (mb_strlen($title) > 100) {
            Response::error(
                "Title must not exceed 100 characters",
                400
            );

            return;
        }

        $updatedFolder =
            $this->folderModel->updateTitle(
                $id,
                $user["id"],
                $title
            );

        Response::success(
            [
                "id" => $updatedFolder["id"],
                "title" => $updatedFolder["title"],
                "type" => $updatedFolder["type"]
            ],
            "Folder updated successfully"
        );
    }


    public function destroy($user, $id)
    {
        // Strict ownership deliberately excludes system folders.
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
        $data = random_bytes(16);

        $data[6] = chr(
            ord($data[6]) & 0x0f | 0x40
        );

        $data[8] = chr(
            ord($data[8]) & 0x3f | 0x80
        );

        return vsprintf(
            "%s%s-%s-%s-%s-%s%s%s",
            str_split(
                bin2hex($data),
                4
            )
        );
    }
}
