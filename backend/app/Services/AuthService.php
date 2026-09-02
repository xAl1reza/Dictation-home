<?php

class AuthService
{
    private $db;
    private $userModel;

    private const PASSWORD_PATTERN = '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/';
    private const NATIONAL_CODE_PATTERN = '/^[0-9]{10}$/';
    private const MOBILE_PATTERN = '/^09\d{9}$/';

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

        $user = $this->userModel->findByNationalCode($nationalCode);

        if (!$user || !password_verify($password, $user["password"])) {
            throw new Exception("AUTH_LOGIN_INVALID");
        }

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
            "user" => $this->formatUser($user)
        ];
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

            // UI display name across dashboard and games
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
