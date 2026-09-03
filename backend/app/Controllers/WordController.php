<?php

class WordController
{
    private const WORD_MAX_LENGTH = 80;

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

        $value = $this->normalizeValue(
            $data["value"] ?? ""
        );


        if (!$this->validateValue($value)) {
            return;
        }


        if (
            $this->wordModel->existsInFolder(
                $folderId,
                $value
            )
        ) {

            Response::error(
                "Word already exists in this folder",
                409
            );

            return;
        }


        $word = $this->wordModel->create([
            "id" => $this->uuid(),
            "folder_id" => $folderId,

            // Database column is still named "word".
            "word" => $value,

            // Legacy DB field; frontend does not currently use it.
            "description" => null
        ]);


        Response::success(
            $this->formatWord($word),
            "Word created successfully"
        );
    }


    public function update($user, $id)
    {
        $word = $this->wordModel->findById(
            $id
        );


        if (!$word) {

            Response::error(
                "Word not found",
                404
            );

            return;
        }


        /*
         * Ownership is verified through the word's folder.
         */
        $folder = $this->getOwnedDictationFolder(
            $user,
            $word["folder_id"]
        );


        if (!$folder) {
            return;
        }


        $data = Request::body();

        $value = $this->normalizeValue(
            $data["value"] ?? ""
        );


        if (!$this->validateValue($value)) {
            return;
        }


        if (
            $this->wordModel->existsInFolder(
                $word["folder_id"],
                $value,
                $id
            )
        ) {

            Response::error(
                "Word already exists in this folder",
                409
            );

            return;
        }


        $updatedWord =
            $this->wordModel->updateValue(
                $id,
                $word["folder_id"],
                $value
            );


        Response::success(
            $this->formatWord(
                $updatedWord
            ),
            "Word updated successfully"
        );
    }


    public function destroy($user, $id)
    {
        $word = $this->wordModel->findById(
            $id
        );


        if (!$word) {

            Response::error(
                "Word not found",
                404
            );

            return;
        }


        /*
         * A user may delete a word only when its
         * dictation folder belongs to that user.
         */
        $folder = $this->getOwnedDictationFolder(
            $user,
            $word["folder_id"]
        );


        if (!$folder) {
            return;
        }


        $this->wordModel->delete(
            $id,
            $word["folder_id"]
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


        if (!$folder) {

            /*
             * Return the same 404 for a missing folder
             * and another user's folder.
             */
            Response::error(
                "Folder not found",
                404
            );

            return null;
        }


        if ($folder["type"] !== "dictation") {

            Response::error(
                "Words are only allowed in dictation folders",
                400
            );

            return null;
        }


        return $folder;
    }


    private function normalizeValue($value)
    {
        $value = trim(
            (string) $value
        );


        return preg_replace(
            '/\s+/u',
            ' ',
            $value
        );
    }


    private function validateValue($value)
    {
        if ($value === "") {

            Response::error(
                "Value is required",
                400
            );

            return false;
        }


        if (
            mb_strlen($value) >
            self::WORD_MAX_LENGTH
        ) {

            Response::error(
                "Value must not exceed 80 characters",
                400
            );

            return false;
        }


        return true;
    }


    private function formatWord($word)
    {
        if (!is_array($word)) {
            return $word;
        }


        return [
            "id" => $word["id"],

            "folderId" =>
                $word["folder_id"],

            "value" =>
                $word["word"],

            "createdAt" =>
                $word["created_at"] ?? null
        ];
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
