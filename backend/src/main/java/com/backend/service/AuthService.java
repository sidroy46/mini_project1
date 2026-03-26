package com.backend.service;

import com.backend.dto.LoginRequest;
import com.backend.dto.LoginResponse;
import com.backend.model.AppUser;
import com.backend.repository.UserRepository;
import com.backend.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public LoginResponse login(LoginRequest request) {
        if (request == null || request.getUsername() == null || request.getPassword() == null) {
            return null;
        }

        String username = request.getUsername().trim().toLowerCase();
        AppUser user = userRepository.findByUsernameIgnoreCase(username).orElse(null);
        if (user == null || !user.isEnabled() || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return null;
        }

        String token = jwtService.generateToken(user.getUsername(), user.getRole());
        return new LoginResponse(token, user.getRole(), user.getUsername());
    }
}
