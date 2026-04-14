package com.hms.hospitalmanagement.controller;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

import com.hms.hospitalmanagement.model.Appointment;
import com.hms.hospitalmanagement.model.AppointmentStatus;
import com.hms.hospitalmanagement.service.AppointmentService;
import com.hms.service.EmailService;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = {"http://localhost:*", "https://localhost:*", "http://192.168.*.*:*", "https://*.ngrok-free.app", "https://*.ngrok-free.dev", "https://*.ngrok.io"})
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final EmailService emailService;

    // ==================== PUBLIC ENDPOINTS ====================

    /**
     * Book appointment — accessible by patients (no auth required for patient booking)
     */
    @PostMapping("/book")
    public ResponseEntity<?> bookAppointment(@RequestBody BookAppointmentRequest request) {
        try {
            Appointment appointment = new Appointment();
            appointment.setPatientName(request.getPatientName());
            appointment.setPatientPhone(request.getPatientPhone());
            appointment.setDoctorUsername(request.getDoctorUsername());
            appointment.setDoctorName(request.getDoctorName());
            appointment.setSpecialization(request.getSpecialization());
            appointment.setAppointmentDate(request.getAppointmentDate());
            appointment.setPreferredTime(request.getPreferredTime());
            appointment.setReason(request.getReason());
            appointment.setStatus(AppointmentStatus.PENDING);

            Appointment saved = appointmentService.bookAppointment(appointment);

            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get available time slots for a doctor on a given date — public
     */
    @GetMapping("/available-slots")
    public ResponseEntity<List<String>> getAvailableSlots(
            @RequestParam String doctorUsername,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<String> slots = appointmentService.getAvailableSlots(doctorUsername, date);
        return ResponseEntity.ok(slots);
    }

    /**
     * Get appointments by patient phone — public (used by patient dashboard)
     */
    @GetMapping("/patient-by-phone/{phone}")
    public ResponseEntity<List<Appointment>> getAppointmentsByPatientPhone(@PathVariable String phone) {
        List<Appointment> appointments = appointmentService.getAppointmentsByPatientPhone(phone);
        return ResponseEntity.ok(appointments);
    }

    /**
     * Get appointments by patient name — public (used by patient dashboard)
     */
    @GetMapping("/patient-by-name/{name}")
    public ResponseEntity<List<Appointment>> getAppointmentsByPatientName(@PathVariable String name) {
        List<Appointment> appointments = appointmentService.getAppointmentsByPatientName(name);
        return ResponseEntity.ok(appointments);
    }

    // ==================== DOCTOR ENDPOINTS ====================

    /**
     * Get all appointments for a specific doctor
     */
    @GetMapping("/doctor-username/{username}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public ResponseEntity<List<Appointment>> getAppointmentsByDoctorUsername(@PathVariable String username) {
        List<Appointment> appointments = appointmentService.getAppointmentsByDoctorUsername(username);
        return ResponseEntity.ok(appointments);
    }

    /**
     * Get unique patients related to a specific doctor (from appointments)
     */
    @GetMapping("/doctor-patients/{username}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public ResponseEntity<List<Map<String, Object>>> getPatientsByDoctorUsername(@PathVariable String username) {
        List<Appointment> appointments = appointmentService.getAppointmentsByDoctorUsername(username);
        
        // Deduplicate by patientName+patientPhone, collect unique patients with latest appointment info
        Map<String, Map<String, Object>> uniquePatients = new LinkedHashMap<>();
        for (Appointment a : appointments) {
            String key = (a.getPatientName() != null ? a.getPatientName() : "") + "|" + (a.getPatientPhone() != null ? a.getPatientPhone() : "");
            if (!uniquePatients.containsKey(key)) {
                Map<String, Object> patient = new LinkedHashMap<>();
                patient.put("patientName", a.getPatientName());
                patient.put("patientPhone", a.getPatientPhone());
                patient.put("lastAppointmentDate", a.getAppointmentDate() != null ? a.getAppointmentDate().toString() : null);
                patient.put("lastStatus", a.getStatus() != null ? a.getStatus().name() : null);
                patient.put("reason", a.getReason());
                patient.put("appointmentId", a.getId());
                
                // Include additional patient details from the Patient entity if available
                if (a.getPatient() != null) {
                    patient.put("patientId", a.getPatient().getId());
                    patient.put("email", a.getPatient().getEmail());
                    patient.put("age", a.getPatient().getAge());
                    patient.put("bloodGroup", a.getPatient().getBloodGroup());
                    patient.put("gender", a.getPatient().getGender());
                } else {
                    patient.put("patientId", null);
                    patient.put("email", null);
                    patient.put("age", null);
                    patient.put("bloodGroup", null);
                    patient.put("gender", null);
                }
                
                uniquePatients.put(key, patient);
            }
        }
        
        return ResponseEntity.ok(new ArrayList<>(uniquePatients.values()));
    }

    /**
     * Get pending appointment requests for a doctor
     */
    @GetMapping("/doctor-pending/{username}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public ResponseEntity<List<Appointment>> getPendingByDoctorUsername(@PathVariable String username) {
        List<Appointment> appointments = appointmentService.getPendingByDoctorUsername(username);
        return ResponseEntity.ok(appointments);
    }

    /**
     * Get today's approved appointments for a doctor, sorted by queue number
     */
    @GetMapping("/doctor-approved-today/{username}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public ResponseEntity<List<Appointment>> getApprovedTodayForDoctor(@PathVariable String username) {
        List<Appointment> appointments = appointmentService.getApprovedForDoctorToday(username, LocalDate.now());
        return ResponseEntity.ok(appointments);
    }

    /**
     * Doctor approves an appointment
     */
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public ResponseEntity<Appointment> approveAppointment(@PathVariable Long id, @RequestBody(required = false) DoctorMessageRequest request) {
        String message = (request != null) ? request.getMessage() : null;
        String patientEmail = (request != null) ? request.getPatientEmail() : null;
        Appointment approved = appointmentService.approveAppointment(id, message);

        // Send email notification (non-blocking)
        if (patientEmail != null && !patientEmail.isEmpty()) {
            try {
                emailService.sendAppointmentApproved(
                        patientEmail, approved.getPatientName(),
                        approved.getDoctorName() != null ? approved.getDoctorName() : approved.getDoctorUsername(),
                        approved.getAppointmentDate() != null ? approved.getAppointmentDate().toString() : "TBD",
                        approved.getPreferredTime(), message
                );
            } catch (Exception e) {
                // Don't fail the approval if email fails
                System.err.println("Failed to send approval email: " + e.getMessage());
            }
        }

        return ResponseEntity.ok(approved);
    }

    /**
     * Doctor rejects an appointment
     */
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public ResponseEntity<Appointment> rejectAppointment(@PathVariable Long id, @RequestBody(required = false) DoctorMessageRequest request) {
        String message = (request != null) ? request.getMessage() : null;
        String patientEmail = (request != null) ? request.getPatientEmail() : null;
        Appointment rejected = appointmentService.rejectAppointment(id, message);

        // Send email notification (non-blocking)
        if (patientEmail != null && !patientEmail.isEmpty()) {
            try {
                emailService.sendAppointmentRejected(
                        patientEmail, rejected.getPatientName(),
                        rejected.getDoctorName() != null ? rejected.getDoctorName() : rejected.getDoctorUsername(),
                        rejected.getAppointmentDate() != null ? rejected.getAppointmentDate().toString() : "TBD",
                        message
                );
            } catch (Exception e) {
                // Don't fail the rejection if email fails
                System.err.println("Failed to send rejection email: " + e.getMessage());
            }
        }

        return ResponseEntity.ok(rejected);
    }

    /**
     * Mark appointment as completed
     */
    @PutMapping("/{id}/complete")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public ResponseEntity<Appointment> completeAppointment(@PathVariable Long id) {
        Appointment completed = appointmentService.completeAppointment(id);
        return ResponseEntity.ok(completed);
    }

    // ==================== ADMIN/DOCTOR ENDPOINTS ====================

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public ResponseEntity<Appointment> createAppointment(@Valid @RequestBody Appointment appointment) {
        Appointment savedAppointment = appointmentService.createAppointment(appointment);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedAppointment);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public ResponseEntity<List<Appointment>> getAllAppointments() {
        List<Appointment> appointments = appointmentService.getAllAppointments();
        return ResponseEntity.ok(appointments);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public ResponseEntity<Appointment> getAppointmentById(@PathVariable Long id) {
        Appointment appointment = appointmentService.getAppointmentById(id);
        return ResponseEntity.ok(appointment);
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public ResponseEntity<List<Appointment>> getAppointmentsByPatient(@PathVariable Long patientId) {
        List<Appointment> appointments = appointmentService.getAppointmentsByPatient(patientId);
        return ResponseEntity.ok(appointments);
    }

    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public ResponseEntity<List<Appointment>> getAppointmentsByDoctor(@PathVariable Long doctorId) {
        List<Appointment> appointments = appointmentService.getAppointmentsByDoctor(doctorId);
        return ResponseEntity.ok(appointments);
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public ResponseEntity<List<Appointment>> getAppointmentsByStatus(@PathVariable AppointmentStatus status) {
        List<Appointment> appointments = appointmentService.getAppointmentsByStatus(status);
        return ResponseEntity.ok(appointments);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public ResponseEntity<Appointment> updateAppointment(@PathVariable Long id, @Valid @RequestBody Appointment appointment) {
        Appointment updatedAppointment = appointmentService.updateAppointment(id, appointment);
        return ResponseEntity.ok(updatedAppointment);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR')")
    public ResponseEntity<Appointment> updateStatus(@PathVariable Long id, @RequestBody AppointmentStatusRequest request) {
        Appointment updatedAppointment = appointmentService.updateStatus(id, request.getStatus());
        return ResponseEntity.ok(updatedAppointment);
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<Appointment> cancelAppointment(@PathVariable Long id) {
        Appointment cancelled = appointmentService.cancelAppointment(id);
        return ResponseEntity.ok(cancelled);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAppointment(@PathVariable Long id) {
        appointmentService.deleteAppointment(id);
        return ResponseEntity.noContent().build();
    }

    // ==================== REQUEST DTOs ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BookAppointmentRequest {
        private String patientName;
        private String patientPhone;
        private String patientEmail;
        private String doctorUsername;
        private String doctorName;
        private String specialization;
        private LocalDate appointmentDate;
        private String preferredTime;
        private String reason;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DoctorMessageRequest {
        private String message;
        private String patientEmail;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AppointmentStatusRequest {
        private AppointmentStatus status;
    }
}

