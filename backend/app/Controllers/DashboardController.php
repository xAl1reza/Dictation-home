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


        Response::success(
            $stats,
            "Dashboard data fetched successfully"
        );
    }
}