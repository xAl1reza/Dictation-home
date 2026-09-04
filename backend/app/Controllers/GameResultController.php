<?php

class GameResultController
{
    private const SESSION_ID_MAX_LENGTH = 128;
    private const MAX_COUNTER = 10000;

    private $gameResultModel;
    private $folderModel;


    public function __construct($db)
    {
        $this->gameResultModel =
            new GameResult($db);

        $this->folderModel =
            new Folder($db);
    }


    public function store($user)
    {
        $data = Request::body();

        $sessionId = trim(
            (string) ($data["sessionId"] ?? "")
        );

        $gameType = trim(
            (string) ($data["gameType"] ?? "")
        );

        if (
            $sessionId === "" ||
            mb_strlen($sessionId) >
                self::SESSION_ID_MAX_LENGTH
        ) {
            Response::error(
                "Invalid sessionId",
                400
            );

            return;
        }

        if (
            !in_array(
                $gameType,
                ["math", "science", "dictation"],
                true
            )
        ) {
            Response::error(
                "Invalid game type",
                400
            );

            return;
        }

        $correct = $this->readCounter(
            $data,
            "correct"
        );

        $wrong = $this->readCounter(
            $data,
            "wrong"
        );

        $skipped = $this->readCounter(
            $data,
            "skipped"
        );

        $rounds = $this->readCounter(
            $data,
            "rounds"
        );

        if (
            $correct === null ||
            $wrong === null ||
            $skipped === null ||
            $rounds === null
        ) {
            return;
        }

        if (
            ($correct + $wrong + $skipped) >
            $rounds
        ) {
            Response::error(
                "Invalid game counters",
                400
            );

            return;
        }

        $started = $this->parseDate(
            $data["startedAt"] ?? null,
            "startedAt"
        );

        if ($started === false) {
            return;
        }

        $finished = $this->parseDate(
            $data["finishedAt"] ?? null,
            "finishedAt"
        );

        if ($finished === false) {
            return;
        }

        if ($finished < $started) {
            Response::error(
                "finishedAt must not be before startedAt",
                400
            );

            return;
        }

        $folderId = $data["folderId"] ?? null;
        $folderId = $folderId === null
            ? null
            : trim((string) $folderId);

        if ($gameType === "math") {
            // Math has no folder contract.
            $folderId = null;
        } else {
            if ($folderId === "" || $folderId === null) {
                Response::error(
                    "Folder is required",
                    400
                );

                return;
            }

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

                return;
            }

            if ($folder["type"] !== $gameType) {
                Response::error(
                    "Folder type does not match game type",
                    400
                );

                return;
            }
        }

        $existing =
            $this->gameResultModel->findByUserAndSession(
                $user["id"],
                $sessionId
            );

        if ($existing) {
            Response::error(
                "Game result already exists",
                409
            );

            return;
        }

        // Server-owned derived fields. Client userId/score/accuracy/etc are ignored.
        $answered = $correct + $wrong;
        $score = $correct - $wrong;

        $accuracy = $answered > 0
            ? (int) round(
                ($correct / $answered) * 100
            )
            : 0;

        $durationSeconds =
            $finished->getTimestamp() -
            $started->getTimestamp();

        if ($durationSeconds > 21600) {
            Response::error(
                "Game duration is too long",
                400
            );

            return;
        }

        try {
            $result = $this->gameResultModel->create([
                "id" => $this->uuid(),
                "user_id" => $user["id"],
                "folder_id" => $folderId,
                "session_id" => $sessionId,
                "game_type" => $gameType,
                "score" => $score,
                "correct" => $correct,
                "wrong" => $wrong,
                "skipped" => $skipped,
                "answered" => $answered,
                "rounds" => $rounds,
                "accuracy" => $accuracy,
                "duration_seconds" =>
                    $durationSeconds,
                "started_at" =>
                    $started->format("Y-m-d H:i:s"),
                "finished_at" =>
                    $finished->format("Y-m-d H:i:s")
            ]);
        } catch (PDOException $e) {
            if ((string) $e->getCode() === "23000") {
                Response::error(
                    "Game result already exists",
                    409
                );

                return;
            }

            throw $e;
        }

        Response::success(
            $this->formatResult($result),
            "Game result saved successfully"
        );
    }


    public function history($user)
    {
        $gameType = isset($_GET["gameType"])
            ? trim((string) $_GET["gameType"])
            : null;

        if ($gameType === "") {
            $gameType = null;
        }

        if (
            $gameType !== null &&
            !in_array(
                $gameType,
                ["math", "science", "dictation"],
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

        $results = array_map(
            [$this, "formatResult"],
            $results
        );

        Response::success(
            $results,
            "Game history fetched successfully"
        );
    }


    private function readCounter($data, $field)
    {
        if (!array_key_exists($field, $data)) {
            Response::error(
                $field . " is required",
                400
            );

            return null;
        }

        $value = $data[$field];

        if (
            filter_var(
                $value,
                FILTER_VALIDATE_INT
            ) === false
        ) {
            Response::error(
                "Invalid " . $field,
                400
            );

            return null;
        }

        $value = (int) $value;

        if (
            $value < 0 ||
            $value > self::MAX_COUNTER
        ) {
            Response::error(
                "Invalid " . $field,
                400
            );

            return null;
        }

        return $value;
    }


    private function parseDate($value, $field)
    {
        if (!is_string($value)) {
            Response::error(
                $field . " is required",
                400
            );

            return false;
        }

        $value = trim($value);

        if (
            $value === "" ||
            mb_strlen($value) > 64
        ) {
            Response::error(
                "Invalid " . $field,
                400
            );

            return false;
        }

        if (
            !preg_match(
                '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+\-]\d{2}:\d{2})$/',
                $value
            )
        ) {
            Response::error(
                "Invalid " . $field,
                400
            );

            return false;
        }

        try {
            return new DateTimeImmutable($value);
        } catch (Exception $e) {
            Response::error(
                "Invalid " . $field,
                400
            );

            return false;
        }
    }


    private function formatResult($row)
    {
        if (!is_array($row)) {
            return $row;
        }

        return [
            "id" => $row["id"],
            "sessionId" => $row["session_id"],
            "gameType" => $row["game_type"],
            "userId" => $row["user_id"],
            "folderId" => $row["folder_id"],
            "folderTitle" =>
                $row["folder_title"] ?? null,
            "score" => (int) $row["score"],
            "correct" => (int) $row["correct"],
            "wrong" => (int) $row["wrong"],
            "skipped" => (int) $row["skipped"],
            "answered" => (int) $row["answered"],
            "rounds" => (int) $row["rounds"],
            "accuracy" => (int) $row["accuracy"],
            "durationSeconds" =>
                (int) $row["duration_seconds"],
            "startedAt" => $row["started_at"],
            "finishedAt" => $row["finished_at"],
            "createdAt" =>
                $row["created_at"] ?? null
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
