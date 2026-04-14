package com.hms.hospitalmanagement.service;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.hms.hospitalmanagement.exception.PatientNotFoundException;
import com.hms.hospitalmanagement.model.Patient;
import com.hms.hospitalmanagement.repository.PatientRepository;
import com.hms.hospitalmanagement.repository.PatientRecordRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;
    private final PatientCredentialGeneratorService credentialGeneratorService;
    private final PasswordEncoder passwordEncoder;
    private final AppointmentService appointmentService;
    private final PatientRecordRepository patientRecordRepository;

    public Patient savePatient(Patient patient) {
        // Check for duplicate email
        if (patient.getEmail() != null && patientRepository.existsByEmail(patient.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        // Use mobile number as Patient Login ID
        String phone = patient.getPhone();
        if (phone == null || phone.trim().isEmpty()) {
            throw new IllegalArgumentException("Mobile number is required");
        }
        String loginId = phone.trim().replaceAll("[^0-9]", "");

        // Check if this mobile number is already registered
        if (patientRepository.existsByPatientLoginId(loginId)) {
            throw new IllegalArgumentException("This mobile number is already registered");
        }

        // Use user-provided password (from plaintextPassword field) or generate one
        String rawPassword = patient.getPlaintextPassword();
        if (rawPassword == null || rawPassword.trim().isEmpty()) {
            // Fallback: auto-generate if no password provided (e.g., admin adding patient)
            rawPassword = credentialGeneratorService.generateSecurePassword();
        }

        // Set the credentials in the patient object
        patient.setPatientLoginId(loginId);
        patient.setPatientPassword(passwordEncoder.encode(rawPassword));
        patient.setPlaintextPassword(rawPassword);

        // Store the plaintext password temporarily on the patient object for response
        patient.setGeneratedPlaintextPassword(rawPassword);

        System.out.println("=== PATIENT REGISTRATION ===");
        System.out.println("Name: " + patient.getName());
        System.out.println("Phone: " + patient.getPhone());
        System.out.println("Login ID (mobile): " + loginId);
        System.out.println("Password (encoded): " + patient.getPatientPassword());

        Patient savedPatient = patientRepository.save(patient);
        
        System.out.println("Patient saved successfully with ID: " + savedPatient.getId());
        
        return savedPatient;
    }

    public List<Patient> getAllPatients() {
        return patientRepository.findAll();
    }

    public Patient getPatientById(Long id) {
        return patientRepository.findById(id)
                .orElseThrow(() -> new PatientNotFoundException(id));
    }

    public Patient updatePatient(Long id, Patient patient) {
        Patient existingPatient = patientRepository.findById(id)
                .orElseThrow(() -> new PatientNotFoundException(id));
        
        // Check for duplicate email (if email is being changed)
        if (patient.getEmail() != null && !patient.getEmail().equals(existingPatient.getEmail())) {
            if (patientRepository.existsByEmail(patient.getEmail())) {
                throw new IllegalArgumentException("Email already exists");
            }
        }
        
        existingPatient.setName(patient.getName());
        existingPatient.setAge(patient.getAge());
        existingPatient.setGender(patient.getGender());
        existingPatient.setPhone(patient.getPhone());
        existingPatient.setAddress(patient.getAddress());
        if (patient.getBloodGroup() != null) {
            existingPatient.setBloodGroup(patient.getBloodGroup());
        }
        if (patient.getEmail() != null) {
            existingPatient.setEmail(patient.getEmail());
        }
        if (patient.getDateOfBirth() != null) {
            existingPatient.setDateOfBirth(patient.getDateOfBirth());
        }
        
        return patientRepository.save(existingPatient);
    }

    @Transactional
    public void deletePatient(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new PatientNotFoundException(id));

        // Delete all appointments linked to this patient
        try {
            appointmentService.deleteAppointmentsByPatientId(id);
        } catch (Exception ignored) {}

        // Also delete appointments matched by phone (some may not have patient_id FK set)
        if (patient.getPhone() != null && !patient.getPhone().isEmpty()) {
            try {
                appointmentService.deleteAppointmentsByPatientPhone(patient.getPhone());
            } catch (Exception ignored) {}
        }

        // Delete patient records by name
        if (patient.getName() != null && !patient.getName().isEmpty()) {
            try {
                patientRecordRepository.deleteByPatientName(patient.getName());
            } catch (Exception ignored) {}
        }

        patientRepository.deleteById(id);
    }

    public Patient savePatientWithoutCredentialGeneration(Patient patient) {
        return patientRepository.save(patient);
    }

    public Patient getPatientByPhone(String phone) {
        String cleanedPhone = phone.trim().replaceAll("[^0-9]", "");
        return patientRepository.findByPhone(cleanedPhone)
                .orElseThrow(() -> new PatientNotFoundException("No patient found with phone: " + phone));
    }
}
