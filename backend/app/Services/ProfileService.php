<?php

class ProfileService
{
    private const MOBILE_PATTERN = '/^09\d{9}$/';
    private const PASSWORD_PATTERN = '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/';

    private const AVATAR_MAX_BYTES = 2097152;

    private const AVATAR_MIME_MAP = [
        "image/jpeg" => "jpg",
        "image/png" => "png",
        "image/webp" => "webp"
    ];

    private $userModel;

    public function __construct($db)
    {
        $this->userModel = new User($db);
    }

    public function updateProfile($user, $data)
    {
        $current = $this->userModel->findById(
            $user["id"]
        );

        if (!$current) {
            throw new Exception("PROFILE_USER_NOT_FOUND");
        }

        $editableFields = [
            "firstName",
            "lastName",
            "motherPhone",
            "fatherPhone",
            "birthDate",
            "schoolName",
            "grade"
        ];

        $hasEditableField = false;

        foreach ($editableFields as $field) {
            if (array_key_exists($field, $data)) {
                $hasEditableField = true;
                break;
            }
        }

        if (!$hasEditableField) {
            throw new Exception("PROFILE_NO_FIELDS");
        }

        $firstName = array_key_exists("firstName", $data)
            ? $this->normalizeText($data["firstName"])
            : $current["first_name"];

        $lastName = array_key_exists("lastName", $data)
            ? $this->normalizeText($data["lastName"])
            : $current["last_name"];

        $motherPhone = array_key_exists("motherPhone", $data)
            ? $this->normalizeDigits(
                trim((string)$data["motherPhone"])
            )
            : $current["mother_phone"];

        $fatherPhone = array_key_exists("fatherPhone", $data)
            ? $this->normalizeDigits(
                trim((string)$data["fatherPhone"])
            )
            : $current["father_phone"];

        $birthDate = array_key_exists("birthDate", $data)
            ? trim((string)$data["birthDate"])
            : $current["birth_date"];

        $schoolName = array_key_exists("schoolName", $data)
            ? $this->normalizeText($data["schoolName"])
            : $current["school_name"];

        $gradeValue = array_key_exists("grade", $data)
            ? $this->normalizeDigits(
                trim((string)$data["grade"])
            )
            : (string)$current["grade"];

        if (
            mb_strlen($firstName) < 2 ||
            mb_strlen($firstName) > 50
        ) {
            throw new Exception("PROFILE_FIRST_NAME_INVALID");
        }

        if (
            mb_strlen($lastName) < 2 ||
            mb_strlen($lastName) > 80
        ) {
            throw new Exception("PROFILE_LAST_NAME_INVALID");
        }

        if (!preg_match(self::MOBILE_PATTERN, $motherPhone)) {
            throw new Exception("PROFILE_MOTHER_PHONE_INVALID");
        }

        if (!preg_match(self::MOBILE_PATTERN, $fatherPhone)) {
            throw new Exception("PROFILE_FATHER_PHONE_INVALID");
        }

        if (!$this->isValidBirthDate($birthDate)) {
            throw new Exception("PROFILE_BIRTH_DATE_INVALID");
        }

        if (
            mb_strlen($schoolName) < 2 ||
            mb_strlen($schoolName) > 100
        ) {
            throw new Exception("PROFILE_SCHOOL_INVALID");
        }

        if (!in_array(
            $gradeValue,
            ["1", "2", "3", "4", "5", "6"],
            true
        )) {
            throw new Exception("PROFILE_GRADE_INVALID");
        }

        $updated = $this->userModel->updateProfile(
            $user["id"],
            [
                "first_name" => $firstName,
                "last_name" => $lastName,
                "mother_phone" => $motherPhone,
                "father_phone" => $fatherPhone,
                "birth_date" => $birthDate,
                "school_name" => $schoolName,
                "grade" => (int)$gradeValue
            ]
        );

        if (!$updated) {
            throw new Exception("PROFILE_USER_NOT_FOUND");
        }

        return $this->formatUser($updated);
    }

    public function changePassword($user, $data)
    {
        $currentPassword =
            (string)($data["currentPassword"] ?? "");

        $newPassword =
            (string)($data["newPassword"] ?? "");

        if ($currentPassword === "") {
            throw new Exception(
                "PROFILE_CURRENT_PASSWORD_REQUIRED"
            );
        }

        if (!preg_match(
            self::PASSWORD_PATTERN,
            $newPassword
        )) {
            throw new Exception(
                "PROFILE_NEW_PASSWORD_WEAK"
            );
        }

        $current = $this->userModel->findWithPasswordById(
            $user["id"]
        );

        if (!$current) {
            throw new Exception("PROFILE_USER_NOT_FOUND");
        }

        if (!password_verify(
            $currentPassword,
            $current["password"]
        )) {
            throw new Exception(
                "PROFILE_CURRENT_PASSWORD_INVALID"
            );
        }

        $this->userModel->updatePassword(
            $user["id"],
            password_hash(
                $newPassword,
                PASSWORD_DEFAULT
            )
        );

        return true;
    }

    public function uploadAvatar($user, $file)
    {
        if (
            !$file ||
            !is_array($file) ||
            ($file["error"] ?? UPLOAD_ERR_NO_FILE)
                === UPLOAD_ERR_NO_FILE
        ) {
            throw new Exception("PROFILE_AVATAR_REQUIRED");
        }

        if (
            ($file["error"] ?? UPLOAD_ERR_NO_FILE)
            !== UPLOAD_ERR_OK
        ) {
            throw new Exception(
                "PROFILE_AVATAR_UPLOAD_INVALID"
            );
        }

        $size = (int)($file["size"] ?? 0);

        if (
            $size <= 0 ||
            $size > self::AVATAR_MAX_BYTES
        ) {
            throw new Exception(
                "PROFILE_AVATAR_TOO_LARGE"
            );
        }

        $tmpName = (string)($file["tmp_name"] ?? "");

        if (
            $tmpName === "" ||
            !is_uploaded_file($tmpName)
        ) {
            throw new Exception(
                "PROFILE_AVATAR_UPLOAD_INVALID"
            );
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);

        if (!$finfo) {
            throw new Exception(
                "PROFILE_AVATAR_MIME_CHECK_FAILED"
            );
        }

        $mime = finfo_file(
            $finfo,
            $tmpName
        );

        finfo_close($finfo);

        if (
            !$mime ||
            !array_key_exists(
                $mime,
                self::AVATAR_MIME_MAP
            )
        ) {
            throw new Exception(
                "PROFILE_AVATAR_TYPE_INVALID"
            );
        }

        $extension =
            self::AVATAR_MIME_MAP[$mime];

        $uploadDirectory =
            $this->avatarStorageDirectory();

        if (
            !is_dir($uploadDirectory) &&
            !mkdir(
                $uploadDirectory,
                0755,
                true
            ) &&
            !is_dir($uploadDirectory)
        ) {
            throw new Exception(
                "PROFILE_AVATAR_SAVE_FAILED"
            );
        }

        $filename =
            bin2hex(random_bytes(16)) .
            "." .
            $extension;

        $absolutePath =
            $uploadDirectory .
            DIRECTORY_SEPARATOR .
            $filename;

        if (!move_uploaded_file(
            $tmpName,
            $absolutePath
        )) {
            throw new Exception(
                "PROFILE_AVATAR_SAVE_FAILED"
            );
        }

        /*
         * Keep only a logical relative reference in DB.
         * The physical file stays outside public/ and is served
         * through the authenticated GET /profile/avatar endpoint.
         */
        $relativePath =
            "uploads/avatars/" .
            $filename;

        $current =
            $this->userModel->findById(
                $user["id"]
            );

        if (!$current) {
            @unlink($absolutePath);
            throw new Exception(
                "PROFILE_USER_NOT_FOUND"
            );
        }

        try {
            $updated =
                $this->userModel->updateAvatar(
                    $user["id"],
                    $relativePath
                );
        } catch (Throwable $exception) {
            @unlink($absolutePath);
            throw $exception;
        }

        $this->deleteStoredAvatarFile(
            $current["avatar"] ?? null
        );

        return $this->formatUser($updated);
    }

    public function deleteAvatar($user)
    {
        $current =
            $this->userModel->findById(
                $user["id"]
            );

        if (!$current) {
            throw new Exception(
                "PROFILE_USER_NOT_FOUND"
            );
        }

        $updated =
            $this->userModel->updateAvatar(
                $user["id"],
                null
            );

        $this->deleteStoredAvatarFile(
            $current["avatar"] ?? null
        );

        return $this->formatUser($updated);
    }

    public function getAvatarFile($user)
    {
        $current =
            $this->userModel->findById(
                $user["id"]
            );

        if (!$current) {
            throw new Exception(
                "PROFILE_USER_NOT_FOUND"
            );
        }

        $avatar =
            $current["avatar"] ?? null;

        if (
            !is_string($avatar) ||
            !str_starts_with(
                $avatar,
                "uploads/avatars/"
            )
        ) {
            throw new Exception(
                "PROFILE_AVATAR_NOT_FOUND"
            );
        }

        $filename = basename($avatar);

        if ($filename === "") {
            throw new Exception(
                "PROFILE_AVATAR_NOT_FOUND"
            );
        }

        $path =
            $this->avatarStorageDirectory() .
            DIRECTORY_SEPARATOR .
            $filename;

        if (!is_file($path)) {
            throw new Exception(
                "PROFILE_AVATAR_NOT_FOUND"
            );
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);

        if (!$finfo) {
            throw new Exception(
                "PROFILE_AVATAR_MIME_CHECK_FAILED"
            );
        }

        $mime = finfo_file(
            $finfo,
            $path
        );

        finfo_close($finfo);

        if (
            !$mime ||
            !array_key_exists(
                $mime,
                self::AVATAR_MIME_MAP
            )
        ) {
            throw new Exception(
                "PROFILE_AVATAR_STORAGE_INVALID"
            );
        }

        return [
            "path" => $path,
            "mime" => $mime,
            "size" => filesize($path)
        ];
    }

    private function avatarStorageDirectory()
    {
        return
            dirname(__DIR__, 2) .
            "/storage/uploads/avatars";
    }

    private function deleteStoredAvatarFile($avatar)
    {
        if (
            !is_string($avatar) ||
            !str_starts_with(
                $avatar,
                "uploads/avatars/"
            )
        ) {
            return;
        }

        $filename = basename($avatar);

        if ($filename === "") {
            return;
        }

        $path =
            $this->avatarStorageDirectory() .
            DIRECTORY_SEPARATOR .
            $filename;

        if (is_file($path)) {
            @unlink($path);
        }
    }

    private function isValidBirthDate($birthDate)
    {
        if ($birthDate === "") {
            return false;
        }

        $date = DateTime::createFromFormat(
            "Y-m-d",
            $birthDate
        );

        if (
            !$date ||
            $date->format("Y-m-d")
                !== $birthDate
        ) {
            return false;
        }

        $today = new DateTime("today");

        return $date <= $today;
    }

    private function normalizeText($value)
    {
        $value = trim((string)$value);

        return preg_replace(
            '/\s+/u',
            ' ',
            $value
        );
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
            "nationalCode" =>
                $user["national_code"],
            "firstName" =>
                $user["first_name"],
            "lastName" =>
                $user["last_name"],
            "name" =>
                $user["first_name"],
            "motherPhone" =>
                $user["mother_phone"],
            "fatherPhone" =>
                $user["father_phone"],
            "birthDate" =>
                $user["birth_date"],
            "schoolName" =>
                $user["school_name"],
            "grade" =>
                (int)$user["grade"],
            "avatar" =>
                $user["avatar"] ?? null
        ];
    }
}
