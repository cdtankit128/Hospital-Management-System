package com.hms.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.hms.dto.LoginRequest;
import com.hms.dto.LoginResponse;
import com.hms.dto.RegisterRequest;
import com.hms.entity.Role;
import com.hms.entity.User;
import com.hms.hospitalmanagement.repository.PatientRecordRepository;
import com.hms.hospitalmanagement.service.AppointmentService;
import com.hms.security.JwtTokenProvider;
import com.hms.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = {"http://localhost:*", "https://localhost:*", "http://192.168.*.*:*", "https://*.ngrok-free.app", "https://*.ngrok-free.dev", "https://*.ngrok.io"})
public class AuthController {
    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;
    private final AppointmentService appointmentService;
    private final PatientRecordRepository patientRecordRepository;
    private final com.hms.repository.UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    private static final String AVATAR_DIR = "uploads/avatars";

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            User user = userService.registerUser(
                    request.getUsername(),
                    request.getEmail(),
                    request.getPassword(),
                    request.getRole() != null ? request.getRole() : Role.DOCTOR,
                    request.getFullName(),
                    request.getSpecialization(),
                    request.getPhone(),
                    request.getExperience(),
                    request.getDesignation(),
                    request.getGender()
            );

            return ResponseEntity.ok(new LoginResponse(
                    "User registered successfully",
                    user.getId(),
                    user.getUsername(),
                    user.getEmail(),
                    user.getRole().name(),
                    null,
                    user.getFullName(),
                    user.getSpecialization(),
                    user.getDesignation()
            ));
        } catch (IllegalArgumentException e) {
            String errorMsg = e.getMessage();
            // Return 409 Conflict for duplicate username/email
            if (errorMsg.contains("already exists")) {
                return ResponseEntity.status(409).body(new LoginResponse(errorMsg, null, null, null, null, null, null, null, null));
            }
            // Return 400 Bad Request for other validation errors
            return ResponseEntity.badRequest().body(new LoginResponse(errorMsg, null, null, null, null, null, null, null, null));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        // DEBUG LOGS - Verify request is being received
        System.out.println("=== LOGIN HIT ===");
        System.out.println("Request object: " + request);
        if (request != null) {
            System.out.println("  Username: " + request.getUsername());
            System.out.println("  Password: " + (request.getPassword() != null ? "[REDACTED]" : "null"));
        }
        
        User user = userService.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Block login for deactivated users BEFORE checking password
        if (!user.isEnabled()) {
            return ResponseEntity.status(403).body(new LoginResponse("ACCOUNT_DEACTIVATED", null, null, null, null, null, user.getFullName(), null, null));
        }

        if (!userService.validatePassword(request.getPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body(new LoginResponse("Invalid password", null, null, null, null, null, null, null, null));
        }

        String token = jwtTokenProvider.generateToken(user.getUsername(), user.getRole().name());

        return ResponseEntity.ok(new LoginResponse(
                "Login successful",
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().name(),
                token,
                user.getFullName(),
                user.getSpecialization(),
                user.getDesignation()
        ));
    }

    @GetMapping("/doctors-list")
    public ResponseEntity<List<Map<String, String>>> getRegisteredDoctors() {
        List<User> doctors = userService.getDoctorsList();
        List<Map<String, String>> result = doctors.stream().map(doc -> {
            Map<String, String> m = new HashMap<>();
            m.put("fullName", doc.getFullName() != null ? doc.getFullName() : doc.getUsername());
            m.put("username", doc.getUsername());
            m.put("specialization", doc.getSpecialization() != null ? doc.getSpecialization() : "General Medicine");
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/admin/doctors")
    public ResponseEntity<List<Map<String, Object>>> getAllDoctorsForAdmin() {
        List<User> doctors = userService.getAllDoctors();
        List<Map<String, Object>> result = doctors.stream().map(doc -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", doc.getId());
            m.put("name", doc.getFullName() != null ? doc.getFullName() : doc.getUsername());
            m.put("username", doc.getUsername());
            m.put("specialization", doc.getSpecialization() != null ? doc.getSpecialization() : "General Medicine");
            m.put("designation", doc.getDesignation() != null ? doc.getDesignation() : "");
            m.put("email", doc.getEmail());
            m.put("phone", doc.getPhone());
            m.put("gender", doc.getGender());
            m.put("status", doc.isEnabled() ? "Active" : "Inactive");
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @PutMapping("/admin/doctors/{id}")
    public ResponseEntity<?> updateDoctorForAdmin(@PathVariable Long id, @RequestBody Map<String, String> updates) {
        Optional<User> optionalUser = userService.findById(id);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        User doctor = optionalUser.get();
        if (updates.containsKey("name")) {
            doctor.setFullName(updates.get("name"));
        }
        if (updates.containsKey("specialization")) {
            doctor.setSpecialization(updates.get("specialization"));
        }
        if (updates.containsKey("designation")) {
            doctor.setDesignation(updates.get("designation"));
        }
        if (updates.containsKey("email")) {
            doctor.setEmail(updates.get("email"));
        }
        if (updates.containsKey("phone")) {
            doctor.setPhone(updates.get("phone"));
        }
        if (updates.containsKey("gender")) {
            doctor.setGender(updates.get("gender"));
        }
        if (updates.containsKey("status")) {
            doctor.setEnabled("Active".equalsIgnoreCase(updates.get("status")));
        }
        userService.saveUser(doctor);
        Map<String, Object> result2 = new HashMap<>();
        result2.put("message", "Doctor updated successfully");
        result2.put("id", doctor.getId());
        return ResponseEntity.ok(result2);
    }

    @Transactional
    @DeleteMapping("/admin/doctors/{id}")
    public ResponseEntity<?> deleteDoctorForAdmin(@PathVariable Long id) {
        Optional<User> optionalUser = userService.findById(id);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        User doctor = optionalUser.get();
        String username = doctor.getUsername();

        // Cascade delete: remove all appointments and records for this doctor
        try { appointmentService.deleteAppointmentsByDoctorUsername(username); } catch (Exception ignored) {}
        try { patientRecordRepository.deleteByDoctorUsername(username); } catch (Exception ignored) {}

        // Delete avatar file
        if (doctor.getProfileImagePath() != null) {
            try { Files.deleteIfExists(Paths.get(doctor.getProfileImagePath())); } catch (Exception ignored) {}
        }

        userService.deleteUser(id);
        Map<String, Object> result2 = new HashMap<>();
        result2.put("message", "Doctor deleted successfully");
        return ResponseEntity.ok(result2);
    }

    @GetMapping("/doctor-preview/{username}")
    public ResponseEntity<?> getDoctorPreview(@PathVariable String username) {
        Optional<User> optionalUser = userService.findByUsername(username.trim());
        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("found", false));
        }
        User user = optionalUser.get();
        if (user.getRole() != Role.DOCTOR) {
            return ResponseEntity.status(404).body(Map.of("found", false));
        }
        Map<String, Object> result = new HashMap<>();
        result.put("found", true);
        result.put("fullName", user.getFullName() != null ? user.getFullName() : user.getUsername());
        result.put("specialization", user.getSpecialization() != null ? user.getSpecialization() : "General Medicine");
        result.put("designation", user.getDesignation() != null ? user.getDesignation() : "");
        result.put("hasAvatar", user.getProfileImagePath() != null && Files.exists(Paths.get(user.getProfileImagePath())));
        return ResponseEntity.ok(result);
    }

    @PostMapping("/upload-avatar/{username}")
    public ResponseEntity<?> uploadAvatar(@PathVariable String username, @RequestParam("avatar") MultipartFile file) {
        Optional<User> optionalUser = userService.findByUsername(username.trim());
        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        }
        User user = optionalUser.get();
        try {
            Path uploadDir = Paths.get(AVATAR_DIR);
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }
            // Delete old avatar if exists
            if (user.getProfileImagePath() != null) {
                try { Files.deleteIfExists(Paths.get(user.getProfileImagePath())); } catch (Exception ignored) {}
            }
            String ext = "";
            String origName = file.getOriginalFilename();
            if (origName != null && origName.contains(".")) {
                ext = origName.substring(origName.lastIndexOf("."));
            }
            String fileName = username.trim() + ext;
            Path filePath = uploadDir.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            user.setProfileImagePath(filePath.toString());
            userService.saveUser(user);
            return ResponseEntity.ok(Map.of("message", "Avatar uploaded successfully"));
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to upload avatar: " + e.getMessage()));
        }
    }

    @GetMapping("/avatar/{username}")
    public ResponseEntity<byte[]> getAvatar(@PathVariable String username) {
        Optional<User> optionalUser = userService.findByUsername(username.trim());
        if (optionalUser.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        User user = optionalUser.get();
        if (user.getProfileImagePath() == null) {
            return ResponseEntity.notFound().build();
        }
        Path filePath = Paths.get(user.getProfileImagePath());
        if (!Files.exists(filePath)) {
            return ResponseEntity.notFound().build();
        }
        try {
            byte[] imageData = Files.readAllBytes(filePath);
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) contentType = "image/jpeg";
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
                    .header("Pragma", "no-cache")
                    .body(imageData);
        } catch (IOException e) {
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping("/verify-username")
    public ResponseEntity<?> verifyUsername(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        if (username == null || username.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username is required"));
        }
        Optional<User> user = userService.findByUsername(username.trim());
        if (user.isPresent()) {
            return ResponseEntity.ok(Map.of("message", "Username verified", "verified", true));
        }
        return ResponseEntity.status(404).body(Map.of("message", "No account found with this username", "verified", false));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String newPassword = request.get("newPassword");
        if (username == null || username.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username is required"));
        }
        if (newPassword == null || newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("message", "Password must be at least 6 characters"));
        }
        Optional<User> optionalUser = userService.findByUsername(username.trim());
        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "No account found with this username"));
        }
        User user = optionalUser.get();
        userService.updatePassword(user, newPassword);
        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }

    // ==================== RECEPTIONIST MANAGEMENT (Admin only) ====================

    @PostMapping("/admin/receptionist")
    public ResponseEntity<?> createReceptionist(@RequestBody Map<String, String> request) {
        try {
            String username = request.get("username");
            String email = request.get("email");
            String password = request.get("password");
            String fullName = request.get("fullName");
            String phone = request.get("phone");

            if (username == null || password == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Username and password are required"));
            }
            if (password.length() < 6) {
                return ResponseEntity.badRequest().body(Map.of("message", "Password must be at least 6 characters"));
            }

            if (userRepository.existsByUsername(username)) {
                return ResponseEntity.status(409).body(Map.of("message", "Username already exists"));
            }
            // Auto-generate email if not provided
            String finalEmail = (email != null && !email.isBlank()) ? email.trim() : username.trim() + "@hms.local";
            if (userRepository.existsByEmail(finalEmail)) {
                return ResponseEntity.status(409).body(Map.of("message", "Email already exists"));
            }

            User receptionist = new User();
            receptionist.setUsername(username.trim());
            receptionist.setEmail(finalEmail);
            receptionist.setPassword(passwordEncoder.encode(password));
            receptionist.setRole(Role.RECEPTIONIST);
            receptionist.setFullName(fullName != null ? fullName.trim() : username.trim());
            if (phone != null && !phone.isBlank()) receptionist.setPhone(phone.trim());
            receptionist.setEnabled(true);
            userService.saveUser(receptionist);

            Map<String, Object> result = new HashMap<>();
            result.put("message", "Receptionist created successfully");
            result.put("id", receptionist.getId());
            result.put("username", receptionist.getUsername());
            return ResponseEntity.status(201).body(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/admin/receptionists")
    public ResponseEntity<List<Map<String, Object>>> getAllReceptionists() {
        List<User> receptionists = userRepository.findByRole(Role.RECEPTIONIST);
        List<Map<String, Object>> result = receptionists.stream().map(r -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", r.getId());
            m.put("username", r.getUsername());
            m.put("fullName", r.getFullName() != null ? r.getFullName() : r.getUsername());
            m.put("email", r.getEmail());
            m.put("phone", r.getPhone());
            m.put("status", r.isEnabled() ? "Active" : "Inactive");
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/admin/receptionist/{id}")
    public ResponseEntity<?> deleteReceptionist(@PathVariable Long id) {
        Optional<User> optionalUser = userService.findById(id);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        User user = optionalUser.get();
        if (user.getRole() != Role.RECEPTIONIST) {
            return ResponseEntity.badRequest().body(Map.of("message", "User is not a receptionist"));
        }
        userService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "Receptionist deleted successfully"));
    }

    @PutMapping("/admin/receptionist/{id}")
    public ResponseEntity<?> updateReceptionist(@PathVariable Long id, @RequestBody Map<String, String> updates) {
        Optional<User> optionalUser = userService.findById(id);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        User rec = optionalUser.get();
        if (rec.getRole() != Role.RECEPTIONIST) {
            return ResponseEntity.badRequest().body(Map.of("message", "User is not a receptionist"));
        }
        if (updates.containsKey("fullName")) rec.setFullName(updates.get("fullName"));
        if (updates.containsKey("phone")) rec.setPhone(updates.get("phone"));
        if (updates.containsKey("email")) rec.setEmail(updates.get("email"));
        if (updates.containsKey("username")) {
            String newUsername = updates.get("username").trim();
            if (!newUsername.equals(rec.getUsername()) && userRepository.existsByUsername(newUsername)) {
                return ResponseEntity.status(409).body(Map.of("message", "Username already exists"));
            }
            rec.setUsername(newUsername);
        }
        if (updates.containsKey("status")) {
            rec.setEnabled("Active".equalsIgnoreCase(updates.get("status")));
        }
        userService.saveUser(rec);
        return ResponseEntity.ok(Map.of("message", "Receptionist updated successfully", "id", rec.getId()));
    }

    @PostMapping("/admin/reset-password/{id}")
    public ResponseEntity<?> adminResetPassword(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String newPassword = request.get("newPassword");
        if (newPassword == null || newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("message", "Password must be at least 6 characters"));
        }
        Optional<User> optionalUser = userService.findById(id);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        User user = optionalUser.get();
        userService.updatePassword(user, newPassword);
        return ResponseEntity.ok(Map.of("message", "Password reset successfully for " + user.getUsername()));
    }
}
