package com.backend.controller;

import com.backend.model.Student;
import com.backend.service.ProjectDataService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/students")
public class StudentController {
    private final ProjectDataService projectDataService;

    public StudentController(ProjectDataService projectDataService) {
        this.projectDataService = projectDataService;
    }

    @GetMapping
    public List<Student> getStudents() {
        return projectDataService.getStudents();
    }

    @PostMapping
    public Student createStudent(
            @RequestParam String name,
            @RequestParam String rollNumber,
            @RequestParam String email,
            @RequestParam String department,
            @RequestParam(required = false) List<MultipartFile> faceImages
    ) throws IOException {
        return projectDataService.createStudent(name, rollNumber, email, department, faceImages);
    }

    @PutMapping("/{id}")
    public Student updateStudent(
            @PathVariable Long id,
            @RequestParam String name,
            @RequestParam String rollNumber,
            @RequestParam String email,
            @RequestParam String department,
            @RequestParam(required = false) List<MultipartFile> faceImages
    ) throws IOException {
        return projectDataService.updateStudent(id, name, rollNumber, email, department, faceImages);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStudent(@PathVariable Long id) {
        projectDataService.deleteStudent(id);
        return ResponseEntity.noContent().build();
    }
}
