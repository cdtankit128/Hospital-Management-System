package com.hms.hospitalmanagement.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hms.hospitalmanagement.model.Patient;
import com.hms.hospitalmanagement.model.PatientRecord;
import com.hms.hospitalmanagement.service.PatientCredentialGeneratorService;
import com.hms.hospitalmanagement.service.PatientRecordService;
import com.hms.hospitalmanagement.service.PatientService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = {"http://localhost:*", "https://localhost:*", "http://192.168.*.*:*", "https://*.ngrok-free.app", "https://*.ngrok-free.dev", "https://*.ngrok.io"})
public class PatientController {

    private final PatientService patientService;
    private final PatientCredentialGeneratorService credentialGeneratorService;
    private final PasswordEncoder passwordEncoder;
    private final PatientRecordService patientRecordService;

    @PostMapping
    public ResponseEntity<?> addPatient(@RequestBody Patient patient) {
        try {
            // Save patient and generate credentials
            Patient savedPatient = patientService.savePatient(patient);
            
            // Prepare response with credentials
            Map<String, Object> response = new HashMap<>();
            response.put("id", savedPatient.getId());
            response.put("name", savedPatient.getName());
            response.put("email", savedPatient.getEmail());
            response.put("bloodGroup", savedPatient.getBloodGroup());
            response.put("age", savedPatient.getAge());
            response.put("patientLoginId", savedPatient.getPatientLoginId());
            response.put("message", "Patient registered successfully. Login with your Mobile Number and Password.");
            response.put("success", true);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            // Handle duplicate email or validation errors
            Map<String, Object> response = new HashMap<>();
            response.put("message", e.getMessage());
            response.put("error", e.getMessage());
            response.put("success", false);
            
            if (e.getMessage().contains("already exists")) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public ResponseEntity<List<Patient>> getAllPatients() {
        List<Patient> patients = patientService.getAllPatients();
        return ResponseEntity.ok(patients);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public ResponseEntity<Patient> getPatientById(@PathVariable Long id) {
        Patient patient = patientService.getPatientById(id);
        return ResponseEntity.ok(patient);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public ResponseEntity<?> updatePatient(@PathVariable Long id, @RequestBody Patient patient) {
        try {
            Patient updatedPatient = patientService.updatePatient(id, patient);
            return ResponseEntity.ok(updatedPatient);
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", e.getMessage());
            response.put("error", e.getMessage());
            
            if (e.getMessage().contains("already exists")) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletePatient(@PathVariable Long id) {
        patientService.deletePatient(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/credentials")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public ResponseEntity<?> getPatientCredentials(@PathVariable Long id) {
        try {
            Patient patient = patientService.getPatientById(id);
            Map<String, Object> response = new HashMap<>();
            response.put("patientLoginId", patient.getPatientLoginId());
            response.put("patientName", patient.getName());
            response.put("patientPassword", patient.getPlaintextPassword());
            response.put("email", patient.getEmail());
            response.put("id", patient.getId());
            response.put("message", "Credentials retrieved successfully");
            response.put("success", true);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Failed to retrieve credentials: " + e.getMessage());
            response.put("success", false);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    @PostMapping("/{id}/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> resetPatientPassword(@PathVariable Long id) {
        try {
            Patient patient = patientService.getPatientById(id);
            
            // Generate new password
            String newPassword = credentialGeneratorService.generateSecurePassword();
            
            // Store plaintext for response
            patient.setGeneratedPlaintextPassword(newPassword);
            patient.setPlaintextPassword(newPassword);
            
            // Encode and save password
            patient.setPatientPassword(passwordEncoder.encode(newPassword));
            patientService.savePatientWithoutCredentialGeneration(patient);
            
            Map<String, Object> response = new HashMap<>();
            response.put("patientLoginId", patient.getPatientLoginId());
            response.put("newPassword", newPassword);
            response.put("patientName", patient.getName());
            response.put("message", "Password reset successfully");
            response.put("success", true);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Failed to reset password: " + e.getMessage());
            response.put("success", false);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/records-by-name")
    public ResponseEntity<List<PatientRecord>> getPatientRecordsByName(@org.springframework.web.bind.annotation.RequestParam String name) {
        List<PatientRecord> records = patientRecordService.getRecordsByPatientName(name);
        return ResponseEntity.ok(records);
    }

    @GetMapping("/search-by-phone")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public ResponseEntity<?> searchPatientByPhone(@org.springframework.web.bind.annotation.RequestParam String phone) {
        try {
            Patient patient = patientService.getPatientByPhone(phone);
            List<PatientRecord> records = patientRecordService.getRecordsByPatientName(patient.getName());

            Map<String, Object> response = new HashMap<>();
            response.put("id", patient.getId());
            response.put("name", patient.getName());
            response.put("age", patient.getAge());
            response.put("gender", patient.getGender());
            response.put("phone", patient.getPhone());
            response.put("email", patient.getEmail());
            response.put("bloodGroup", patient.getBloodGroup());
            response.put("records", records);
            response.put("success", true);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", e.getMessage());
            response.put("success", false);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }
}
