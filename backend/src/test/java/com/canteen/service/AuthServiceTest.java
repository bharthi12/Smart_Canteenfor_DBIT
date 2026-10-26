package com.canteen.service;

import com.canteen.dto.auth.RegisterRequest;
import com.canteen.dto.auth.UserResponse;
import com.canteen.entity.User;
import com.canteen.enums.Role;
import com.canteen.exception.BusinessRuleException;
import com.canteen.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    @Test
    @DisplayName("Public registration must always create a STUDENT account")
    void testRegistrationCreatesStudentOnly() {
        when(userRepository.existsByEmail("test@college.edu")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("hashed_secret123");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(1L);
            return user;
        });

        RegisterRequest request = new RegisterRequest("Test Student", "test@college.edu", "secret123");
        UserResponse response = authService.registerStudent(request);

        assertNotNull(response);
        assertEquals(Role.STUDENT, response.role());
        assertEquals("test@college.edu", response.email());
        verify(passwordEncoder, times(1)).encode("secret123");
    }

    @Test
    @DisplayName("Duplicate email registration must be rejected with an error")
    void testDuplicateEmailRejected() {
        when(userRepository.existsByEmail("existing@college.edu")).thenReturn(true);

        RegisterRequest request = new RegisterRequest("Duplicate User", "existing@college.edu", "secret123");

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
            authService.registerStudent(request)
        );

        assertEquals("EMAIL_ALREADY_EXISTS", ex.getCode());
        verify(userRepository, never()).save(any());
    }
}
