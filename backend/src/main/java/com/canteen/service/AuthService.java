package com.canteen.service;

import com.canteen.dto.auth.RegisterRequest;
import com.canteen.dto.auth.UserResponse;
import com.canteen.entity.User;
import com.canteen.enums.Role;
import com.canteen.exception.BusinessRuleException;
import com.canteen.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.college.email-domain:}")
    private String collegeEmailDomain;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserResponse registerStudent(RegisterRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();

        // Check configurable college email domain if configured
        if (collegeEmailDomain != null && !collegeEmailDomain.trim().isEmpty()) {
            String domain = collegeEmailDomain.trim().toLowerCase();
            if (!normalizedEmail.endsWith("@" + domain) && !normalizedEmail.endsWith("." + domain)) {
                throw new BusinessRuleException("INVALID_EMAIL_DOMAIN",
                    "Registration requires a verified college email ending in @" + domain);
            }
        }

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new BusinessRuleException("EMAIL_ALREADY_EXISTS",
                "An account with this email already exists.");
        }

        // Always create as STUDENT - never accept role from client
        User student = new User(
            request.name().trim(),
            normalizedEmail,
            passwordEncoder.encode(request.password()),
            Role.STUDENT
        );

        User saved = userRepository.save(student);
        return UserResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {
        if (email == null) {
            throw new BusinessRuleException("UNAUTHENTICATED", "No authenticated user session.");
        }
        User user = userRepository.findByEmail(email.trim().toLowerCase())
            .orElseThrow(() -> new BusinessRuleException("USER_NOT_FOUND", "User account not found."));
        return UserResponse.fromEntity(user);
    }
}
