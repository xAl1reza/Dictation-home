<?php

class PartnerSchoolController
{
    private $partnerSchoolModel;


    public function __construct($db)
    {
        $this->partnerSchoolModel =
            new PartnerSchool($db);
    }


    /*
    |--------------------------------------------------------------------------
    | Province Summaries
    |--------------------------------------------------------------------------
    */

    public function provinces()
    {
        $provinces =
            $this->partnerSchoolModel
                ->getProvinceSummaries();


        Response::success(
            $provinces,
            "Province school statistics fetched successfully"
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Schools By Province
    |--------------------------------------------------------------------------
    */

    public function schools($provinceCode)
    {
        $provinceCode = strtoupper(
            trim($provinceCode)
        );


        if (
            !preg_match(
                '/^IR-\d{2}$/',
                $provinceCode
            )
        ) {

            Response::error(
                "Invalid province code",
                400
            );

            return;
        }


        $province =
            $this->partnerSchoolModel
                ->findProvinceSummary(
                    $provinceCode
                );


        if (!$province) {

            Response::error(
                "Province not found",
                404
            );

            return;
        }


        $schools =
            $this->partnerSchoolModel
                ->getActiveByProvince(
                    $provinceCode
                );


        Response::success(
            [
                "province" => $province,
                "schools" => $schools
            ],
            "Province schools fetched successfully"
        );
    }
}