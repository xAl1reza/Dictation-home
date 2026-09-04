<?php

class ScienceQuestionController
{
    private const QUESTION_MAX_LENGTH = 220;
    private const ANSWER_MAX_LENGTH = 600;

    private $scienceQuestionModel;
    private $folderModel;


    public function __construct($db)
    {
        $this->scienceQuestionModel =
            new ScienceQuestion($db);

        $this->folderModel =
            new Folder($db);
    }


    public function index($user, $folderId)
    {
        // Reading is allowed from personal science folders and
        // the matching-grade system science folder.
        $folder = $this->getAccessibleScienceFolder(
            $user,
            $folderId
        );

        if (!$folder) {
            return;
        }

        $questions =
            $this->scienceQuestionModel->getByFolderId(
                $folderId
            );

        $questions = array_map(
            [$this, "formatQuestion"],
            $questions
        );

        Response::success(
            $questions,
            "Science questions fetched successfully"
        );
    }


    public function store($user, $folderId)
    {
        // System folders are never writable by users.
        $folder = $this->getOwnedScienceFolder(
            $user,
            $folderId
        );

        if (!$folder) {
            return;
        }

        $data = Request::body();

        $question = $this->normalizeText(
            $data["question"] ?? ""
        );

        $answer = $this->normalizeText(
            $data["answer"] ?? ""
        );

        if (!$this->validateFields(
            $question,
            $answer
        )) {
            return;
        }

        if (
            $this->scienceQuestionModel->existsInFolder(
                $folderId,
                $question
            )
        ) {
            Response::error(
                "Question already exists in this folder",
                409
            );

            return;
        }

        $created =
            $this->scienceQuestionModel->create([
                "id" => $this->uuid(),
                "folder_id" => $folderId,
                "question" => $question,
                "answer" => $answer
            ]);

        Response::success(
            $this->formatQuestion($created),
            "Science question created successfully"
        );
    }


    public function update($user, $id)
    {
        $record =
            $this->scienceQuestionModel->findById(
                $id
            );

        if (!$record) {
            Response::error(
                "Science question not found",
                404
            );

            return;
        }

        $folder = $this->getOwnedScienceFolder(
            $user,
            $record["folder_id"]
        );

        if (!$folder) {
            return;
        }

        $data = Request::body();

        $question = $this->normalizeText(
            $data["question"] ?? ""
        );

        $answer = $this->normalizeText(
            $data["answer"] ?? ""
        );

        if (!$this->validateFields(
            $question,
            $answer
        )) {
            return;
        }

        if (
            $this->scienceQuestionModel->existsInFolder(
                $record["folder_id"],
                $question,
                $id
            )
        ) {
            Response::error(
                "Question already exists in this folder",
                409
            );

            return;
        }

        $updated =
            $this->scienceQuestionModel->update(
                $id,
                $record["folder_id"],
                $question,
                $answer
            );

        Response::success(
            $this->formatQuestion($updated),
            "Science question updated successfully"
        );
    }


    public function destroy($user, $id)
    {
        $record =
            $this->scienceQuestionModel->findById(
                $id
            );

        if (!$record) {
            Response::error(
                "Science question not found",
                404
            );

            return;
        }

        $folder = $this->getOwnedScienceFolder(
            $user,
            $record["folder_id"]
        );

        if (!$folder) {
            return;
        }

        $this->scienceQuestionModel->delete(
            $id,
            $record["folder_id"]
        );

        Response::success(
            [],
            "Science question deleted successfully"
        );
    }


    private function getAccessibleScienceFolder(
        $user,
        $folderId
    ) {
        $folder = $this->folderModel->findAccessibleById(
            $folderId,
            $user["id"],
            $user["grade"] ?? null
        );

        if (!$folder) {
            Response::error(
                "Folder not found",
                404
            );

            return null;
        }

        if ($folder["type"] !== "science") {
            Response::error(
                "Science questions are only allowed in science folders",
                400
            );

            return null;
        }

        return $folder;
    }


    private function getOwnedScienceFolder(
        $user,
        $folderId
    ) {
        $folder = $this->folderModel->findById(
            $folderId,
            $user["id"]
        );

        if (!$folder) {
            Response::error(
                "Folder not found",
                404
            );

            return null;
        }

        if ($folder["type"] !== "science") {
            Response::error(
                "Science questions are only allowed in science folders",
                400
            );

            return null;
        }

        return $folder;
    }


    private function normalizeText($value)
    {
        $value = trim(
            (string) $value
        );

        return preg_replace(
            '/[ \t]+/u',
            ' ',
            $value
        );
    }


    private function validateFields(
        $question,
        $answer
    ) {
        if ($question === "") {
            Response::error(
                "Question is required",
                400
            );

            return false;
        }

        if (
            mb_strlen($question) >
            self::QUESTION_MAX_LENGTH
        ) {
            Response::error(
                "Question must not exceed 220 characters",
                400
            );

            return false;
        }

        if ($answer === "") {
            Response::error(
                "Answer is required",
                400
            );

            return false;
        }

        if (
            mb_strlen($answer) >
            self::ANSWER_MAX_LENGTH
        ) {
            Response::error(
                "Answer must not exceed 600 characters",
                400
            );

            return false;
        }

        return true;
    }


    private function formatQuestion($record)
    {
        if (!is_array($record)) {
            return $record;
        }

        return [
            "id" => $record["id"],
            "folderId" =>
                $record["folder_id"],
            "question" =>
                $record["question"],
            "answer" =>
                $record["answer"],
            "createdAt" =>
                $record["created_at"] ?? null
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
