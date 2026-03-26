package com.backend.controller;

import com.backend.dto.MarkAttendanceRequest;
import com.backend.dto.MarkAttendanceResponse;
import com.backend.model.AttendanceRecord;
import com.backend.service.ProjectDataService;
import com.backend.service.ReportExportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {
    private final ProjectDataService projectDataService;
    private final ReportExportService reportExportService;

    public AttendanceController(ProjectDataService projectDataService, ReportExportService reportExportService) {
        this.projectDataService = projectDataService;
        this.reportExportService = reportExportService;
    }

    @PostMapping("/mark")
    public MarkAttendanceResponse markAttendance(@RequestBody MarkAttendanceRequest request) {
        return projectDataService.markAttendance(request.getSubjectId(), request.getImage());
    }

    @GetMapping("/report/daily")
    public List<AttendanceRecord> getDaily(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return projectDataService.getDailyReport(date);
    }

    @GetMapping("/report/monthly")
    public List<AttendanceRecord> getMonthly(@RequestParam int year, @RequestParam int month) {
        return projectDataService.getMonthlyReport(year, month);
    }

    @GetMapping("/report/student")
    public List<AttendanceRecord> getStudent(@RequestParam Long studentId) {
        return projectDataService.getStudentReport(studentId);
    }

    @GetMapping("/report/export/excel")
    public ResponseEntity<byte[]> exportExcel(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) throws IOException {
        byte[] payload = reportExportService.exportDailyExcel(projectDataService.getDailyReport(date));
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=attendance-" + date + ".xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(payload);
    }

    @GetMapping("/report/export/pdf")
    public ResponseEntity<byte[]> exportPdf(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) throws IOException {
        byte[] payload = reportExportService.exportDailyPdf(projectDataService.getDailyReport(date));
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=attendance-" + date + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(payload);
    }
}
