<?php

class LocationController
{
    private $locationModel;

    public function __construct($db)
    {
        $this->locationModel = new Location($db);
    }

    public function provinces()
    {
        Response::success(
            $this->locationModel->getProvinces(),
            "Provinces fetched successfully"
        );
    }

    public function cities($provinceCode)
    {
        $provinceCode = strtoupper(
            trim((string)$provinceCode)
        );

        if (!preg_match('/^IR-\\d{2}$/', $provinceCode)) {
            Response::error(
                "Invalid province code",
                400
            );
            return;
        }

        if (!$this->locationModel->provinceExists($provinceCode)) {
            Response::error(
                "Province not found",
                404
            );
            return;
        }

        Response::success(
            $this->locationModel->getCitiesByProvince($provinceCode),
            "Cities fetched successfully"
        );
    }
}
