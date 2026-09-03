<?php

class PartnerSchool
{
    private $db;


    public function __construct($db)
    {
        $this->db = $db;
    }


    /*
    |--------------------------------------------------------------------------
    | All Provinces + Aggregated School Stats
    |--------------------------------------------------------------------------
    */

    public function getProvinceSummaries()
    {
        $query = $this->db->prepare(
            "SELECT
                p.code AS province_code,
                p.name AS province_name,

                COUNT(s.id) AS school_count,

                COALESCE(
                    SUM(s.students),
                    0
                ) AS student_count

             FROM iran_provinces p

             LEFT JOIN partner_schools s
                ON s.province_code = p.code
                AND s.is_active = 1

             GROUP BY
                p.code,
                p.name

             ORDER BY p.code ASC"
        );


        $query->execute();


        $rows = $query->fetchAll(
            PDO::FETCH_ASSOC
        );


        return array_map(
            [$this, "formatProvince"],
            $rows
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Province Summary
    |--------------------------------------------------------------------------
    */

    public function findProvinceSummary($provinceCode)
    {
        $query = $this->db->prepare(
            "SELECT
                p.code AS province_code,
                p.name AS province_name,

                COUNT(s.id) AS school_count,

                COALESCE(
                    SUM(s.students),
                    0
                ) AS student_count

             FROM iran_provinces p

             LEFT JOIN partner_schools s
                ON s.province_code = p.code
                AND s.is_active = 1

             WHERE p.code = :province_code

             GROUP BY
                p.code,
                p.name

             LIMIT 1"
        );


        $query->execute([
            "province_code" => $provinceCode
        ]);


        $row = $query->fetch(
            PDO::FETCH_ASSOC
        );


        return $row
            ? $this->formatProvince($row)
            : null;
    }


    /*
    |--------------------------------------------------------------------------
    | Schools By Province
    |--------------------------------------------------------------------------
    */

    public function getActiveByProvince($provinceCode)
    {
        $query = $this->db->prepare(
            "SELECT
                id,
                name,
                city,
                students

             FROM partner_schools

             WHERE province_code = :province_code
             AND is_active = 1

             ORDER BY
                city ASC,
                name ASC"
        );


        $query->execute([
            "province_code" => $provinceCode
        ]);


        $rows = $query->fetchAll(
            PDO::FETCH_ASSOC
        );


        return array_map(
            [$this, "formatSchool"],
            $rows
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Frontend Contract
    |--------------------------------------------------------------------------
    */

    private function formatProvince($row)
    {
        return [
            "provinceCode" =>
                $row["province_code"],

            "name" =>
                $row["province_name"],

            "schoolCount" =>
                (int) $row["school_count"],

            "studentCount" =>
                (int) $row["student_count"]
        ];
    }


    private function formatSchool($row)
    {
        return [
            "id" =>
                $row["id"],

            "name" =>
                $row["name"],

            "city" =>
                $row["city"],

            "students" =>
                (int) $row["students"]
        ];
    }
}