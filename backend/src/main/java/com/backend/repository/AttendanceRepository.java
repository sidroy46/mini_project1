package com.backend.repository;

import com.backend.model.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface AttendanceRepository extends JpaRepository<AttendanceRecord, Long> {
    boolean existsByStudentIdAndSubjectIdAndDate(Long studentId, Long subjectId, LocalDate date);

    List<AttendanceRecord> findByDateOrderByTimeDesc(LocalDate date);

    List<AttendanceRecord> findByDateBetweenOrderByDateDescTimeDesc(LocalDate from, LocalDate to);

    List<AttendanceRecord> findByStudentIdOrderByDateDescTimeDesc(Long studentId);

    long countByDate(LocalDate date);

    void deleteByStudentId(Long studentId);

    void deleteBySubjectId(Long subjectId);
}
