package com.backend.controller;

import com.backend.model.Subject;
import com.backend.service.ProjectDataService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
public class SubjectController {
    private final ProjectDataService projectDataService;

    public SubjectController(ProjectDataService projectDataService) {
        this.projectDataService = projectDataService;
    }

    @GetMapping
    public List<Subject> getSubjects() {
        return projectDataService.getSubjects();
    }

    @PostMapping
    public Subject createSubject(@RequestBody Subject subject) {
        return projectDataService.createSubject(subject);
    }

    @PutMapping("/{id}")
    public Subject updateSubject(@PathVariable Long id, @RequestBody Subject subject) {
        return projectDataService.updateSubject(id, subject);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubject(@PathVariable Long id) {
        projectDataService.deleteSubject(id);
        return ResponseEntity.noContent().build();
    }
}
