<?php

class ProfileController
{
    private $profileService;

    public function __construct($db)
    {
        $this->profileService =
            new ProfileService($db);
    }

    public function update($user)
    {
        try {
            $data = Request::body();

            $updatedUser =
                $this->profileService
                    ->updateProfile(
                        $user,
                        $data
                    );

            Response::success(
                $updatedUser,
                "Profile updated successfully"
            );
        } catch (Exception $e) {
            $code = $e->getMessage();

            if ($code === "PROFILE_USER_NOT_FOUND") {
                Response::error($code, 404);
                return;
            }

            if (in_array(
                $code,
                [
                    "PROFILE_NO_FIELDS",
                    "PROFILE_FIRST_NAME_INVALID",
                    "PROFILE_LAST_NAME_INVALID",
                    "PROFILE_MOTHER_PHONE_INVALID",
                    "PROFILE_FATHER_PHONE_INVALID",
                    "PROFILE_BIRTH_DATE_INVALID",
                    "PROFILE_SCHOOL_INVALID",
                    "PROFILE_GRADE_INVALID"
                ],
                true
            )) {
                Response::error($code, 422);
                return;
            }

            throw $e;
        }
    }

    public function changePassword($user)
    {
        try {
            $data = Request::body();

            $this->profileService
                ->changePassword(
                    $user,
                    $data
                );

            Response::success(
                [],
                "Password changed successfully"
            );
        } catch (Exception $e) {
            $code = $e->getMessage();

            if ($code === "PROFILE_USER_NOT_FOUND") {
                Response::error($code, 404);
                return;
            }

            if (in_array(
                $code,
                [
                    "PROFILE_CURRENT_PASSWORD_REQUIRED",
                    "PROFILE_CURRENT_PASSWORD_INVALID",
                    "PROFILE_NEW_PASSWORD_WEAK"
                ],
                true
            )) {
                Response::error($code, 422);
                return;
            }

            throw $e;
        }
    }

    public function uploadAvatar($user)
    {
        try {
            $updatedUser =
                $this->profileService
                    ->uploadAvatar(
                        $user,
                        $_FILES["avatar"] ?? null
                    );

            Response::success(
                $updatedUser,
                "Avatar updated successfully"
            );
        } catch (Exception $e) {
            $code = $e->getMessage();

            if ($code === "PROFILE_USER_NOT_FOUND") {
                Response::error($code, 404);
                return;
            }

            if (in_array(
                $code,
                [
                    "PROFILE_AVATAR_REQUIRED",
                    "PROFILE_AVATAR_UPLOAD_INVALID",
                    "PROFILE_AVATAR_TOO_LARGE",
                    "PROFILE_AVATAR_TYPE_INVALID"
                ],
                true
            )) {
                Response::error($code, 422);
                return;
            }

            throw $e;
        }
    }

    public function avatar($user)
    {
        try {
            $avatar =
                $this->profileService
                    ->getAvatarFile($user);

            header(
                "Content-Type: " .
                $avatar["mime"]
            );

            header(
                "Content-Length: " .
                (string)$avatar["size"]
            );

            header(
                "Cache-Control: private, no-store, max-age=0"
            );

            header(
                "Pragma: no-cache"
            );

            readfile(
                $avatar["path"]
            );

            exit;
        } catch (Exception $e) {
            $code = $e->getMessage();

            if (in_array(
                $code,
                [
                    "PROFILE_USER_NOT_FOUND",
                    "PROFILE_AVATAR_NOT_FOUND"
                ],
                true
            )) {
                Response::error(
                    "PROFILE_AVATAR_NOT_FOUND",
                    404
                );
                return;
            }

            throw $e;
        }
    }

    public function deleteAvatar($user)
    {
        try {
            $updatedUser =
                $this->profileService
                    ->deleteAvatar($user);

            Response::success(
                $updatedUser,
                "Avatar deleted successfully"
            );
        } catch (Exception $e) {
            if (
                $e->getMessage() ===
                "PROFILE_USER_NOT_FOUND"
            ) {
                Response::error(
                    "PROFILE_USER_NOT_FOUND",
                    404
                );
                return;
            }

            throw $e;
        }
    }
}
