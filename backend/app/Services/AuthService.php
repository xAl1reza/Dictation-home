<?php

class AuthService
{
    private $db;
    private $userModel;

    private const PASSWORD_PATTERN = '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/';
    private const NATIONAL_CODE_PATTERN = '/^[0-9]{10}$/';
    private const MOBILE_PATTERN = '/^09\d{9}$/';

    private const LOGIN_MAX_ATTEMPTS = 5;
    private const LOGIN_WINDOW_MINUTES = 15;

    public function __construct($db)
    {
        $this->db = $db;
        $this->userModel = new User($db);
    }

    public function register($data)
    {
        $normalized = $this->validateRegistration($data);

        if ($this->userModel->findByNationalCode($normalized["national_code"])) {
            throw new Exception("AUTH_NATIONAL_CODE_TAKEN");
        }

        $userId = $this->uuidV4();

        $user = $this->userModel->create([
            "id" => $userId,
            "national_code" => $normalized["national_code"],
            "first_name" => $normalized["first_name"],
            "last_name" => $normalized["last_name"],
            "mother_phone" => $normalized["mother_phone"],
            "father_phone" => $normalized["father_phone"],
            "birth_date" => $normalized["birth_date"],
            "password" => password_hash(
                $normalized["password"],
                PASSWORD_DEFAULT
            ),
            "school_name" => $normalized["school_name"],
            "grade" => $normalized["grade"],
            "avatar" => $data["avatar"] ?? null
        ]);

        return $this->formatUser($user);
    }

    public function login($data)
    {
        $nationalCode = $this->normalizeDigits(
            trim((string)($data["nationalCode"] ?? ""))
        );

        $password = (string)($data["password"] ?? "");

        if (
            !preg_match(self::NATIONAL_CODE_PATTERN, $nationalCode) ||
            $password === ""
        ) {
            throw new Exception("AUTH_LOGIN_FIELDS_REQUIRED");
        }

        /*
         * Small maintenance cleanup.
         * Keeps expired tokens and old limiter rows from growing forever.
         */
        $this->cleanupExpiredSecurityRows();

        /*
         * Rate limit is based on a SHA-256 hash of:
         * national code + requester IP.
         * Raw national codes are NOT stored in the limiter table.
         */
        $this->assertLoginAllowed($nationalCode);

        $user = $this->userModel->findByNationalCode($nationalCode);

        if (!$user || !password_verify($password, $user["password"])) {

            $this->recordLoginFailure($nationalCode);

            throw new Exception("AUTH_LOGIN_INVALID");
        }

        /*
         * Successful login clears previous failed attempts
         * for this national-code/IP pair.
         */
        $this->clearLoginFailures($nationalCode);

        /*
         * Keep only one active token per user.
         * Every successful login invalidates all previous sessions.
         */
        $deleteOldTokens = $this->db->prepare(
            "DELETE FROM auth_tokens
             WHERE user_id = :user_id"
        );

        $deleteOldTokens->execute([
            "user_id" => $user["id"]
        ]);

        /*
         * Generate a new active token.
         */
        $token = bin2hex(random_bytes(32));

        $query = $this->db->prepare(
            "INSERT INTO auth_tokens (
                id,
                user_id,
                token,
                expires_at
            ) VALUES (
                :id,
                :user_id,
                :token,
                DATE_ADD(NOW(), INTERVAL 30 DAY)
            )"
        );

        $query->execute([
            "id" => $this->uuidV4(),
            "user_id" => $user["id"],
            "token" => $token
        ]);

        return [
            "token" => $token,
            "expiresInDays" => 30,
            "user" => $this->formatUser($user)
        ];
    }

    public function logout($token)
    {
        $token = trim((string)$token);

        if ($token === "") {
            throw new Exception("AUTH_TOKEN_REQUIRED");
        }

        $query = $this->db->prepare(
            "DELETE FROM auth_tokens
             WHERE token = :token"
        );

        $query->execute([
            "token" => $token
        ]);

        return true;
    }

    private function assertLoginAllowed($nationalCode)
    {
        $keyHash = $this->loginLimitKey($nationalCode);

        $query = $this->db->prepare(
            "SELECT
                attempts,
                window_started
             FROM auth_login_limits
             WHERE key_hash = :key_hash
             LIMIT 1"
        );

        $query->execute([
            "key_hash" => $keyHash
        ]);

        $row = $query->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            return;
        }

        $windowStarted = strtotime($row["window_started"]);
        $windowSeconds = self::LOGIN_WINDOW_MINUTES * 60;

        if (
            $windowStarted === false ||
            (time() - $windowStarted) >= $windowSeconds
        ) {
            $this->deleteLoginLimitRow($keyHash);
            return;
        }

        if ((int)$row["attempts"] >= self::LOGIN_MAX_ATTEMPTS) {
            throw new Exception("AUTH_LOGIN_RATE_LIMITED");
        }
    }

    private function recordLoginFailure($nationalCode)
    {
        $keyHash = $this->loginLimitKey($nationalCode);

        $query = $this->db->prepare(
            "SELECT
                attempts,
                window_started
             FROM auth_login_limits
             WHERE key_hash = :key_hash
             LIMIT 1"
        );

        $query->execute([
            "key_hash" => $keyHash
        ]);

        $row = $query->fetch(PDO::FETCH_ASSOC);

        if (!$row) {

            $insert = $this->db->prepare(
                "INSERT INTO auth_login_limits (
                    key_hash,
                    attempts,
                    window_started
                ) VALUES (
                    :key_hash,
                    1,
                    NOW()
                )"
            );

            $insert->execute([
                "key_hash" => $keyHash
            ]);

            return;
        }

        $windowStarted = strtotime($row["window_started"]);
        $windowSeconds = self::LOGIN_WINDOW_MINUTES * 60;

        if (
            $windowStarted === false ||
            (time() - $windowStarted) >= $windowSeconds
        ) {

            $reset = $this->db->prepare(
                "UPDATE auth_login_limits
                 SET
                    attempts = 1,
                    window_started = NOW()
                 WHERE key_hash = :key_hash"
            );

            $reset->execute([
                "key_hash" => $keyHash
            ]);

            return;
        }

        $update = $this->db->prepare(
            "UPDATE auth_login_limits
             SET attempts = attempts + 1
             WHERE key_hash = :key_hash"
        );

        $update->execute([
            "key_hash" => $keyHash
        ]);
    }

    private function clearLoginFailures($nationalCode)
    {
        $this->deleteLoginLimitRow(
            $this->loginLimitKey($nationalCode)
        );
    }

    private function deleteLoginLimitRow($keyHash)
    {
        $query = $this->db->prepare(
            "DELETE FROM auth_login_limits
             WHERE key_hash = :key_hash"
        );

        $query->execute([
            "key_hash" => $keyHash
        ]);
    }

    private function loginLimitKey($nationalCode)
    {
        /*
         * Do not trust X-Forwarded-For here.
         * REMOTE_ADDR is the direct peer address.
         * If a trusted reverse proxy is added later,
         * proxy handling can be configured explicitly.
         */
        $ip = $_SERVER["REMOTE_ADDR"] ?? "unknown";

        return hash(
            "sha256",
            $nationalCode . "|" . $ip
        );
    }

    private function cleanupExpiredSecurityRows()
    {
        $this->db->exec(
            "DELETE FROM auth_tokens
             WHERE expires_at <= NOW()"
        );

        $this->db->exec(
            "DELETE FROM auth_login_limits
             WHERE updated_at < DATE_SUB(NOW(), INTERVAL 1 DAY)"
        );
    }

    private function validateRegistration($data)
    {
        $nationalCode = $this->normalizeDigits(
            trim((string)($data["nationalCode"] ?? ""))
        );

        $firstName = $this->normalizeText($data["firstName"] ?? "");
        $lastName = $this->normalizeText($data["lastName"] ?? "");

        $motherPhone = $this->normalizeDigits(
            trim((string)($data["motherPhone"] ?? ""))
        );

        $fatherPhone = $this->normalizeDigits(
            trim((string)($data["fatherPhone"] ?? ""))
        );

        $birthDate = trim((string)($data["birthDate"] ?? ""));
        $password = (string)($data["password"] ?? "");
        $schoolName = $this->normalizeText($data["schoolName"] ?? "");
        $grade = (int)($data["grade"] ?? 0);

        if (!preg_match(self::NATIONAL_CODE_PATTERN, $nationalCode)) {
            throw new Exception("AUTH_NATIONAL_CODE_INVALID");
        }

        if (!$this->isValidIranianNationalCode($nationalCode)) {
            throw new Exception("AUTH_NATIONAL_CODE_CHECKSUM_INVALID");
        }

        if (mb_strlen($firstName) < 2 || mb_strlen($firstName) > 50) {
            throw new Exception("AUTH_FIRST_NAME_INVALID");
        }

        if (mb_strlen($lastName) < 2 || mb_strlen($lastName) > 80) {
            throw new Exception("AUTH_LAST_NAME_INVALID");
        }

        if (!preg_match(self::MOBILE_PATTERN, $motherPhone)) {
            throw new Exception("AUTH_MOTHER_PHONE_INVALID");
        }

        if (!preg_match(self::MOBILE_PATTERN, $fatherPhone)) {
            throw new Exception("AUTH_FATHER_PHONE_INVALID");
        }

        if (!$this->isValidBirthDate($birthDate)) {
            throw new Exception("AUTH_BIRTH_DATE_INVALID");
        }

        if (!preg_match(self::PASSWORD_PATTERN, $password)) {
            throw new Exception("AUTH_PASSWORD_WEAK");
        }

        if (mb_strlen($schoolName) < 2 || mb_strlen($schoolName) > 100) {
            throw new Exception("AUTH_SCHOOL_INVALID");
        }

        if ($grade < 1 || $grade > 6) {
            throw new Exception("AUTH_GRADE_INVALID");
        }

        return [
            "national_code" => $nationalCode,
            "first_name" => $firstName,
            "last_name" => $lastName,
            "mother_phone" => $motherPhone,
            "father_phone" => $fatherPhone,
            "birth_date" => $birthDate,
            "password" => $password,
            "school_name" => $schoolName,
            "grade" => $grade
        ];
    }

    private function isValidIranianNationalCode($nationalCode)
    {
        if (!preg_match(self::NATIONAL_CODE_PATTERN, $nationalCode)) {
            return false;
        }

        if (preg_match('/^(\d)\1{9}$/', $nationalCode)) {
            return false;
        }

        $sum = 0;

        for ($index = 0; $index < 9; $index++) {
            $sum += ((int)$nationalCode[$index]) * (10 - $index);
        }

        $remainder = $sum % 11;

        $expectedCheckDigit =
            $remainder < 2
                ? $remainder
                : 11 - $remainder;

        return ((int)$nationalCode[9]) === $expectedCheckDigit;
    }

    private function isValidBirthDate($birthDate)
    {
        if ($birthDate === "") {
            return false;
        }

        $date = DateTime::createFromFormat("Y-m-d", $birthDate);

        if (!$date || $date->format("Y-m-d") !== $birthDate) {
            return false;
        }

        $today = new DateTime("today");

        return $date <= $today;
    }

    private function normalizeText($value)
    {
        $value = trim((string)$value);
        return preg_replace('/\s+/u', ' ', $value);
    }

    private function normalizeDigits($value)
    {
        return strtr((string)$value, [
            "۰" => "0",
            "۱" => "1",
            "۲" => "2",
            "۳" => "3",
            "۴" => "4",
            "۵" => "5",
            "۶" => "6",
            "۷" => "7",
            "۸" => "8",
            "۹" => "9",
            "٠" => "0",
            "١" => "1",
            "٢" => "2",
            "٣" => "3",
            "٤" => "4",
            "٥" => "5",
            "٦" => "6",
            "٧" => "7",
            "٨" => "8",
            "٩" => "9"
        ]);
    }

    private function formatUser($user)
    {
        return [
            "id" => $user["id"],
            "nationalCode" => $user["national_code"],
            "firstName" => $user["first_name"],
            "lastName" => $user["last_name"],

            "name" => $user["first_name"],

            "motherPhone" => $user["mother_phone"],
            "fatherPhone" => $user["father_phone"],
            "birthDate" => $user["birth_date"],
            "schoolName" => $user["school_name"],
            "grade" => (int)$user["grade"],
            "avatar" => $user["avatar"] ?? null
        ];
    }

    private function uuidV4()
    {
        $data = random_bytes(16);

        $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
        $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);

        return vsprintf(
            "%s%s-%s-%s-%s-%s%s%s",
            str_split(bin2hex($data), 4)
        );
    }
}