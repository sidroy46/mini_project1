package com.backend.config;

import com.backend.model.AppUser;
import com.backend.model.Subject;
import com.backend.repository.SubjectRepository;
import com.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class BootstrapData {

    @Bean
    CommandLineRunner seedData(UserRepository userRepository, SubjectRepository subjectRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.findByUsernameIgnoreCase("admin").isEmpty()) {
                AppUser admin = new AppUser();
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setRole("ADMIN");
                admin.setEnabled(true);
                userRepository.save(admin);
            }

            if (userRepository.findByUsernameIgnoreCase("faculty").isEmpty()) {
                AppUser faculty = new AppUser();
                faculty.setUsername("faculty");
                faculty.setPassword(passwordEncoder.encode("faculty123"));
                faculty.setRole("FACULTY");
                faculty.setEnabled(true);
                userRepository.save(faculty);
            }

            if (!subjectRepository.existsByCodeIgnoreCase("CS101")) {
                Subject defaultSubject = new Subject();
                defaultSubject.setCode("CS101");
                defaultSubject.setName("Computer Science");
                defaultSubject.setFacultyName("Faculty Demo");
                defaultSubject.setClassStartTime("09:00");
                defaultSubject.setClassEndTime("10:00");
                subjectRepository.save(defaultSubject);
            }
        };
    }
}
