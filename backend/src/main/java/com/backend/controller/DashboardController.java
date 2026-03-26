package com.backend.controller;

import com.backend.service.ProjectDataService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final ProjectDataService projectDataService;

    public DashboardController(ProjectDataService projectDataService) {
        this.projectDataService = projectDataService;
    }

    @GetMapping("/summary")
    public Map<String, Object> summary() {
        return projectDataService.getDashboardSummary();
    }

    @GetMapping("/chart")
    public Map<String, Integer> chart() {
        return projectDataService.getDashboardChart();
    }
}
