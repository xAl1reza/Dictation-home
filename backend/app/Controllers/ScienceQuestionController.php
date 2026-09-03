<?php

class ScienceQuestionController
{
    private $scienceQuestionModel;
    private $folderModel;


    public function __construct($db)
    {
        $this->scienceQuestionModel =
            new ScienceQuestion($db);

        $this->folderModel =
            new Folder($db);
    }


    /*
    |--------------------------------------------------------------------------
    | List Questions
    |--------------------------------------------------------------------------
    */

    public function index($user, $folderId)
    {
        $folder = $this->getOwnedScienceFolder(
            $user,
            $folderId
        );


        if (!$folder) {
            return;
        }


        $questions =
            $this->scienceQuestionModel
                ->getByFolderId($folderId);


        Response::success(
            $questions,
            "Science questions fetched successfully"
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Create Question
    |--------------------------------------------------------------------------
    */

    public function store($user, $folderId)
    {
        $folder = $this->getOwnedScienceFolder(
            $user,
            $folderId
        );


        if (!$folder) {
            return;
        }


        $data = Request::body();


        $question = trim(
            $data["question"] ?? ""
        );

        $answer = trim(
            $data["answer"] ?? ""
        );


        if ($question === "") {

            Response::error(
                "Question is required",
                400
            );

            return;
        }


        if ($answer === "") {

            Response::error(
                "Answer is required",
                400
            );

            return;
        }


        if (mb_strlen($question) > 220) {

            Response::error(
                "Question must not exceed 220 characters",
                400
            );

            return;
        }


        if (mb_strlen($answer) > 600) {

            Response::error(
                "Answer must not exceed 600 characters",
                400
            );

            return;
        }


        /*
         * Duplicate question inside same folder
         */
        if (
            $this->scienceQuestionModel
                ->questionExistsInFolder(
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
            $this->scienceQuestionModel
                ->create([
                    "id" => $this->uuid(),
                    "folder_id" => $folderId,
                    "question" => $question,
                    "answer" => $answer
                ]);


        Response::success(
            $created,
            "Science question created successfully"
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Update Question
    |--------------------------------------------------------------------------
    */

    public function update($user, $id)
    {
        $existing =
            $this->getOwnedQuestion(
                $user,
                $id
            );


        if (!$existing) {
            return;
        }


        $data = Request::body();


        $question = trim(
            $data["question"] ?? ""
        );

        $answer = trim(
            $data["answer"] ?? ""
        );


        if ($question === "") {

            Response::error(
                "Question is required",
                400
            );

            return;
        }


        if ($answer === "") {

            Response::error(
                "Answer is required",
                400
            );

            return;
        }


        if (mb_strlen($question) > 220) {

            Response::error(
                "Question must not exceed 220 characters",
                400
            );

            return;
        }


        if (mb_strlen($answer) > 600) {

            Response::error(
                "Answer must not exceed 600 characters",
                400
            );

            return;
        }


        /*
         * Prevent duplicate question when editing.
         * Current question ID is excluded.
         */
        if (
            $this->scienceQuestionModel
                ->questionExistsInFolder(
                    $existing["folderId"],
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
            $this->scienceQuestionModel
                ->update(
                    $id,
                    $question,
                    $answer
                );


        Response::success(
            $updated,
            "Science question updated successfully"
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Delete Question
    |--------------------------------------------------------------------------
    */

    public function destroy($user, $id)
    {
        $existing =
            $this->getOwnedQuestion(
                $user,
                $id
            );


        if (!$existing) {
            return;
        }


        $this->scienceQuestionModel
            ->delete($id);


        Response::success(
            [],
            "Science question deleted successfully"
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Ownership + Folder Type
    |--------------------------------------------------------------------------
    */

    private function getOwnedScienceFolder(
        $user,
        $folderId
    ) {

        $folder =
            $this->folderModel
                ->findById(
                    $folderId,
                    $user["id"]
                );


        /*
         * findById checks both:
         * folder exists
         * folder belongs to authenticated user
         */
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


    /*
    |--------------------------------------------------------------------------
    | Question Ownership
    |--------------------------------------------------------------------------
    */

    private function getOwnedQuestion(
        $user,
        $id
    ) {

        $question =
            $this->scienceQuestionModel
                ->findById($id);


        if (!$question) {

            Response::error(
                "Science question not found",
                404
            );

            return null;
        }


        /*
         * Verify that question's folder belongs
         * to authenticated user.
         */
        $folder =
            $this->folderModel
                ->findById(
                    $question["folderId"],
                    $user["id"]
                );


        if (!$folder) {

            Response::error(
                "Science question not found",
                404
            );

            return null;
        }


        if ($folder["type"] !== "science") {

            Response::error(
                "Invalid science question folder",
                400
            );

            return null;
        }


        return $question;
    }


    /*
    |--------------------------------------------------------------------------
    | UUID
    |--------------------------------------------------------------------------
    */

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