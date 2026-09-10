<?php

class Location
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    public function getProvinces()
    {
        $query = $this->db->prepare(
            "SELECT code, name
             FROM iran_provinces
             ORDER BY name ASC"
        );

        $query->execute();

        $rows = $query->fetchAll(PDO::FETCH_ASSOC);

        return array_map(
            function ($row) {
                return [
                    "provinceCode" => $row["code"],
                    "name" => $row["name"]
                ];
            },
            $rows
        );
    }

    public function provinceExists($provinceCode)
    {
        $query = $this->db->prepare(
            "SELECT 1
             FROM iran_provinces
             WHERE code = :province_code
             LIMIT 1"
        );

        $query->execute([
            "province_code" => $provinceCode
        ]);

        return (bool)$query->fetchColumn();
    }

    public function getCitiesByProvince($provinceCode)
    {
        $query = $this->db->prepare(
            "SELECT id, name
             FROM iran_cities
             WHERE province_code = :province_code
             ORDER BY name ASC"
        );

        $query->execute([
            "province_code" => $provinceCode
        ]);

        $rows = $query->fetchAll(PDO::FETCH_ASSOC);

        return array_map(
            function ($row) {
                return [
                    "id" => (int)$row["id"],
                    "name" => $row["name"]
                ];
            },
            $rows
        );
    }

    public function cityBelongsToProvince($cityId, $provinceCode)
    {
        $query = $this->db->prepare(
            "SELECT 1
             FROM iran_cities
             WHERE id = :id
               AND province_code = :province_code
             LIMIT 1"
        );

        $query->execute([
            "id" => $cityId,
            "province_code" => $provinceCode
        ]);

        return (bool)$query->fetchColumn();
    }
}
