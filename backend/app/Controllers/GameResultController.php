<?php

class GameResultController
{
    private $gameResultModel;
    private $folderModel;


    public function __construct($db)
    {
        $this->gameResultModel = new GameResult($db);
        $this->folderModel = new Folder($db);
    }


    public function store($user)
    {
        try {

            $data = Request::body();


            $sessionId = trim(
                $data["sessionId"] ?? ""
            );

            $gameType = trim(
                $data["gameType"] ?? ""
            );


            if ($sessionId === "") {

                Response::error(
                    "Session ID is required",
                    400
                );

                return;
            }


            if (
                !in_array(
                    $gameType,
                    [
                        "dictation",
                        "science",
                        "math"
                    ],
                    true
                )
            ) {

                Response::error(
                    "Invalid game type",
                    400
                );

                return;
            }


            /*
             * Idempotency:
             * same session + same user must not create
             * another game result.
             */
            $existingResult =
                $this->gameResultModel
                    ->findBySessionIdAndUserId(
                        $sessionId,
                        $user["id"]
                    );


            if ($existingResult) {

                Response::success(
                    $existingResult,
                    "Game result already saved"
                );

                return;
            }


            $correct = $this->nonNegativeInteger(
                $data["correct"] ?? null,
                "Correct"
            );

            $wrong = $this->nonNegativeInteger(
                $data["wrong"] ?? null,
                "Wrong"
            );

            $skipped = $this->nonNegativeInteger(
                $data["skipped"] ?? null,
                "Skipped"
            );

            $rounds = $this->nonNegativeInteger(
                $data["rounds"] ?? null,
                "Rounds"
            );


            $folderId = $data["folderId"] ?? null;
            $folderId = $folderId !== null
                ? trim((string) $folderId)
                : null;


            /*
             * Dictation and Science require a folder.
             * Math does not use folders.
             */
            if (
                in_array(
                    $gameType,
                    ["dictation", "science"],
                    true
                )
            ) {

                if (!$folderId) {

                    Response::error(
                        "Folder ID is required for this game type",
                        400
                    );

                    return;
                }


                /*
                 * findById also guarantees ownership:
                 * folder must belong to authenticated user.
                 */
                $folder = $this->folderModel->findById(
                    $folderId,
                    $user["id"]
                );


                if (!$folder) {

                    Response::error(
                        "Folder not found",
                        404
                    );

                    return;
                }


                if ($folder["type"] !== $gameType) {

                    Response::error(
                        "Folder type does not match game type",
                        400
                    );

                    return;
                }

            } else {

                // Math result never belongs to a folder.
                $folderId = null;
            }


            /*
             * Client sends raw counts only.
             * Backend calculates all derived values.
             */
            $score = $correct - $wrong;

            $answered = $correct + $wrong;

            $accuracy = $answered > 0
                ? (int) round(
                    ($correct / $answered) * 100
                )
                : 0;


            [$startedAt, $finishedAt, $durationSeconds] =
                $this->normalizeGameDates(
                    $data["startedAt"] ?? null,
                    $data["finishedAt"] ?? null
                );


            $result = $this->gameResultModel->create([
                "id" => $this->uuid(),

                "session_id" => $sessionId,

                // Never trust userId from client.
                "user_id" => $user["id"],

                "folder_id" => $folderId,

                "game_type" => $gameType,

                "score" => $score,

                "correct" => $correct,

                "wrong" => $wrong,

                "skipped" => $skipped,

                "answered" => $answered,

                "rounds" => $rounds,

                "accuracy" => $accuracy,

                "duration_seconds" => $durationSeconds,

                "started_at" => $startedAt,

                "finished_at" => $finishedAt
            ]);


            Response::success(
                $result,
                "Game result saved successfully"
            );


        } catch (InvalidArgumentException $e) {

            Response::error(
                $e->getMessage(),
                400
            );


        } catch (PDOException $e) {

            /*
             * Protect against a race where the same
             * session gets submitted twice simultaneously.
             */
            if ((int) $e->getCode() === 23000) {

                $existingResult =
                    $this->gameResultModel
                        ->findBySessionIdAndUserId(
                            $sessionId ?? "",
                            $user["id"]
                        );


                if ($existingResult) {

                    Response::success(
                        $existingResult,
                        "Game result already saved"
                    );

                    return;
                }
            }


            Response::error(
                "Could not save game result",
                500
            );
        }
    }


    public function history($user)
    {
        $gameType = isset($_GET["gameType"])
            ? trim($_GET["gameType"])
            : null;


        if ($gameType === "") {
            $gameType = null;
        }


        if (
            $gameType !== null &&
            !in_array(
                $gameType,
                [
                    "dictation",
                    "science",
                    "math"
                ],
                true
            )
        ) {

            Response::error(
                "Invalid game type",
                400
            );

            return;
        }


        $results = $this->gameResultModel->getByUserId(
            $user["id"],
            $gameType
        );


        Response::success(
            $results,
            "Game history fetched successfully"
        );
    }


    private function nonNegativeInteger($value, $field)
    {
        if (
            $value === null ||
            filter_var(
                $value,
                FILTER_VALIDATE_INT,
                [
                    "options" => [
                        "min_range" => 0
                    ]
                ]
            ) === false
        ) {

            throw new InvalidArgumentException(
                $field . " must be a non-negative integer"
            );
        }


        return (int) $value;
    }


    private function normalizeGameDates(
        $startedAt,
        $finishedAt
    ) {

        if (!$startedAt || !$finishedAt) {

            throw new InvalidArgumentException(
                "StartedAt and finishedAt are required"
            );
        }


        try {

            $start = new DateTimeImmutable(
                $startedAt
            );

            $finish = new DateTimeImmutable(
                $finishedAt
            );

        } catch (Exception $e) {

            throw new InvalidArgumentException(
                "Invalid game date format"
            );
        }


        if ($finish < $start) {

            throw new InvalidArgumentException(
                "FinishedAt cannot be before startedAt"
            );
        }


        $utc = new DateTimeZone("UTC");


        $start = $start->setTimezone($utc);
        $finish = $finish->setTimezone($utc);


        $durationSeconds =
            $finish->getTimestamp()
            -
            $start->getTimestamp();


        return [
            $start->format("Y-m-d H:i:s"),
            $finish->format("Y-m-d H:i:s"),
            $durationSeconds
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