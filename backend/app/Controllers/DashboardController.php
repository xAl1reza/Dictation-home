<?php

class DashboardController
{
    private $dashboardModel;


    public function __construct($db)
    {
        $this->dashboardModel = new Dashboard($db);
    }


    public function index($user)
    {
        $stats = $this->dashboardModel->getStats(
            $user["id"]
        );


        /*
         * PDO/MySQL aggregate values such as COUNT/SUM
         * may be returned as strings. Normalize the
         * dashboard contract before sending JSON.
         */
        $stats = $this->normalizeNumericFields(
            $stats
        );


        Response::success(
            $stats,
            "Dashboard data fetched successfully"
        );
    }


    private function normalizeNumericFields($value)
    {
        if (!is_array($value)) {
            return $value;
        }


        $integerFields = [
            "totalScore",
            "totalGames",
            "score",
            "gamesPlayed",
            "correct",
            "wrong",
            "skipped",
            "answered",
            "rounds",
            "durationSeconds"
        ];


        foreach ($value as $key => $item) {

            if (is_array($item)) {

                $value[$key] =
                    $this->normalizeNumericFields(
                        $item
                    );

                continue;
            }


            if (
                in_array(
                    $key,
                    $integerFields,
                    true
                ) &&
                is_numeric($item)
            ) {

                $value[$key] = (int) $item;

                continue;
            }


            if (
                $key === "accuracy" &&
                is_numeric($item)
            ) {

                $number = (float) $item;

                $value[$key] =
                    floor($number) == $number
                        ? (int) $number
                        : $number;
            }
        }


        return $value;
    }
}