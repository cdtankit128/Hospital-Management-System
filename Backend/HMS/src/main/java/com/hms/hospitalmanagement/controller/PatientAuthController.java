package com.hms.hospitalmanagement.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hms.hospitalmanagement.dto.PatientLoginRequest;
import com.hms.hospitalmanagement.model.Patient;
import com.hms.hospitalmanagement.repository.PatientRepository;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth/patient")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = {"http://localhost:*", "https://localhost:*", "http://192.168.*.*:*", "https://*.ngrok-free.app", "https://*.ngrok-free.dev", "https://*.ngrok.io"})
public class PatientAuthController {
    
    private final PatientRepository patientRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> patientLogin(@Valid @RequestBody PatientLoginRequest request) {
        try {
            // Debug logging
            System.out.println("=== PATIENT LOGIN ATTEMPT ===");
            System.out.println("Patient ID: " + request.getPatientLoginId());
            System.out.println("Password provided: " + (request.getPatientPassword() != null ? "[PROVIDED]" : "[NULL]"));
            
            // Find patient by login ID
            Patient patient = patientRepository.findByPatientLoginId(request.getPatientLoginId())
                    .orElseThrow(() -> {
                        System.out.println("Patient not found with ID: " + request.getPatientLoginId());
                        return new RuntimeException("Invalid Patient ID");
                    });

            System.out.println("Patient found: " + patient.getName());
            System.out.println("Stored password hash: " + (patient.getPatientPassword() != null ? "[HASHED]" : "[NULL]"));

            // Validate password
            boolean passwordMatches = passwordEncoder.matches(request.getPatientPassword(), patient.getPatientPassword());
            System.out.println("Password match result: " + passwordMatches);
            
            if (!passwordMatches) {
                System.out.println("Password validation failed");
                Map<String, Object> response = new HashMap<>();
                response.put("message", "Invalid Patient ID or Password");
                response.put("error", "Invalid credentials");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            System.out.println("Patient login successful: " + patient.getPatientLoginId());
            
            // Return patient data (without password)
            Map<String, Object> response = new HashMap<>();
            response.put("id", patient.getId());
            response.put("name", patient.getName());
            response.put("email", patient.getEmail());
            response.put("phone", patient.getPhone());
            response.put("patientLoginId", patient.getPatientLoginId());
            response.put("age", patient.getAge());
            response.put("bloodGroup", patient.getBloodGroup());
            response.put("role", "PATIENT");
            response.put("message", "Login successful");
            response.put("success", true);
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            System.out.println("Patient login error: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> response = new HashMap<>();
            response.put("message", e.getMessage());
            response.put("error", e.getMessage());
            response.put("success", false);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }

    @PostMapping("/verify-mobile")
    public ResponseEntity<?> verifyMobile(@RequestBody Map<String, String> request) {
        String mobile = request.get("mobile");
        if (mobile == null || mobile.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mobile number is required"));
        }
        // patientLoginId is stored as the phone number
        Optional<Patient> patient = patientRepository.findByPatientLoginId(mobile.trim());
        if (patient.isPresent()) {
            return ResponseEntity.ok(Map.of("message", "Mobile number verified", "verified", true));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "No patient found with this mobile number", "verified", false));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String mobile = request.get("mobile");
        String newPassword = request.get("newPassword");
        if (mobile == null || mobile.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mobile number is required"));
        }
        if (newPassword == null || newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("message", "Password must be at least 6 characters"));
        }
        Optional<Patient> optionalPatient = patientRepository.findByPatientLoginId(mobile.trim());
        if (optionalPatient.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "No patient found with this mobile number"));
        }
        Patient patient = optionalPatient.get();
        patient.setPatientPassword(passwordEncoder.encode(newPassword));
        patientRepository.save(patient);
        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }
}
