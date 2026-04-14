package com.hms.hospitalmanagement.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hms.hospitalmanagement.model.Doctor;
import com.hms.hospitalmanagement.model.PatientRecord;
import com.hms.hospitalmanagement.dto.PatientRecordRequest;
import com.hms.hospitalmanagement.dto.PatientRecordResponse;
import com.hms.hospitalmanagement.service.DoctorService;
import com.hms.hospitalmanagement.service.PatientRecordService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = {"http://localhost:*", "https://localhost:*", "http://192.168.*.*:*", "https://*.ngrok-free.app", "https://*.ngrok-free.dev", "https://*.ngrok.io"})
public class DoctorController {

    private final DoctorService doctorService;
    private final PatientRecordService patientRecordService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Doctor> createDoctor(@Valid @RequestBody Doctor doctor) {
        Doctor savedDoctor = doctorService.createDoctor(doctor);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedDoctor);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public ResponseEntity<List<Doctor>> getAllDoctors() {
        List<Doctor> doctors = doctorService.getAllDoctors();
        return ResponseEntity.ok(doctors);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public ResponseEntity<Doctor> getDoctorById(@PathVariable Long id) {
        Doctor doctor = doctorService.getDoctorById(id);
        return ResponseEntity.ok(doctor);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Doctor> updateDoctor(@PathVariable Long id, @Valid @RequestBody Doctor doctor) {
        Doctor updatedDoctor = doctorService.updateDoctor(id, doctor);
        return ResponseEntity.ok(updatedDoctor);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteDoctor(@PathVariable Long id) {
        doctorService.deleteDoctor(id);
        return ResponseEntity.noContent().build();
    }

    // Patient Record Endpoints
    @PostMapping("/patient-record")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<PatientRecordResponse> savePatientRecord(
            @Valid @RequestBody PatientRecordRequest request,
            Authentication authentication) {
        try {
            PatientRecord patientRecord = new PatientRecord();
            patientRecord.setPatientName(request.getPatientName());
            patientRecord.setDiagnosis(request.getDiagnosis());
            patientRecord.setPrescription(request.getPrescription());
            patientRecord.setDoctorUsername(authentication.getName());
            
            PatientRecord saved = patientRecordService.savePatientRecord(patientRecord);
            
            PatientRecordResponse response = new PatientRecordResponse();
            response.setId(saved.getId());
            response.setPatientName(saved.getPatientName());
            response.setDiagnosis(saved.getDiagnosis());
            response.setPrescription(saved.getPrescription());
            response.setMessage("Patient record saved successfully");
            response.setSuccess(true);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            PatientRecordResponse response = new PatientRecordResponse();
            response.setMessage("Error saving patient record: " + e.getMessage());
            response.setSuccess(false);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping("/patient-records")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<List<PatientRecord>> getMyPatientRecords(Authentication authentication) {
        List<PatientRecord> records = patientRecordService.getRecordsByDoctorUsername(authentication.getName());
        return ResponseEntity.ok(records);
    }

    @GetMapping("/patient-record/{id}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<PatientRecord> getPatientRecord(@PathVariable Long id) {
        return patientRecordService.getRecordById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/patient-record/{id}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<PatientRecord> updatePatientRecord(
            @PathVariable Long id,
            @Valid @RequestBody PatientRecordRequest request) {
        try {
            PatientRecord patientRecord = new PatientRecord();
            patientRecord.setPatientName(request.getPatientName());
            patientRecord.setDiagnosis(request.getDiagnosis());
            patientRecord.setPrescription(request.getPrescription());
            
            PatientRecord updated = patientRecordService.updatePatientRecord(id, patientRecord);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/patient-record/{id}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Void> deletePatientRecord(@PathVariable Long id) {
        patientRecordService.deletePatientRecord(id);
        return ResponseEntity.noContent().build();
    }
}
