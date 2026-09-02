<?php

class WordController
{
    private $wordModel;
    private $folderModel;


    public function __construct($db)
    {
        $this->wordModel = new Word($db);
        $this->folderModel = new Folder($db);
    }


    public function index($user, $folderId)
    {
        $folder = $this->getOwnedDictationFolder(
            $user,
            $folderId
        );


        if (!$folder) {
            return;
        }


        $words = $this->wordModel->getByFolderId(
            $folderId
        );


        $words = array_map(
            [$this, "formatWord"],
            $words
        );


        Response::success(
            $words,
            "Words fetched successfully"
        );
    }


    public function store($user, $folderId)
    {
        $folder = $this->getOwnedDictationFolder(
            $user,
            $folderId
        );


        if (!$folder) {
            return;
        }


        $data = Request::body();


        $value = trim(
            $data["value"] ?? ""
        );


        if ($value === "") {

            Response::error(
                "Value is required",
                400
            );

            return;
        }


        $word = $this->wordModel->create([
            "id" => $this->uuid(),

            "folder_id" => $folderId,

            // اسم ستون دیتابیس فعلاً word است.
            "word" => $value,

            "description" => $data["description"] ?? null
        ]);


        Response::success(
            $this->formatWord($word),
            "Word created successfully"
        );
    }


    /*
     * فعلاً Route حذف کلمه را نهایی نکرده‌ایم.
     * این متد برای زمانی که CRUD را کامل می‌کنیم
     * Ownership را هم رعایت می‌کند.
     */
    public function destroy($user, $id, $folderId)
    {
        $folder = $this->getOwnedDictationFolder(
            $user,
            $folderId
        );


        if (!$folder) {
            return;
        }


        $this->wordModel->delete(
            $id,
            $folderId
        );


        Response::success(
            [],
            "Word deleted successfully"
        );
    }


    private function getOwnedDictationFolder(
        $user,
        $folderId
    ) {

        $folder = $this->folderModel->findById(
            $folderId,
            $user["id"]
        );


        /*
         * هم وجود پوشه و هم Ownership
         * در همین Query بررسی می‌شود.
         */
        if (!$folder) {

            Response::error(
                "Folder not found",
                404
            );

            return null;
        }


        /*
         * Word فقط داخل پوشه Dictation مجاز است.
         */
        if ($folder["type"] !== "dictation") {

            Response::error(
                "Words are only allowed in dictation folders",
                400
            );

            return null;
        }


        return $folder;
    }


    private function formatWord($word)
    {
        if (!is_array($word)) {
            return $word;
        }


        if (array_key_exists("word", $word)) {

            $word["value"] = $word["word"];

            unset($word["word"]);
        }


        if (array_key_exists("folder_id", $word)) {

            $word["folderId"] =
                $word["folder_id"];

            unset($word["folder_id"]);
        }


        return $word;
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