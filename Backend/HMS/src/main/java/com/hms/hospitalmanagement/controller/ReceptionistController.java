package com.hms.hospitalmanagement.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
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
import com.hms.hospitalmanagement.model.Payment;
import com.hms.hospitalmanagement.service.AppointmentService;
import com.hms.hospitalmanagement.service.PaymentService;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/receptionist")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = {"http://localhost:*", "https://localhost:*", "http://192.168.*.*:*", "https://*.ngrok-free.app", "https://*.ngrok-free.dev", "https://*.ngrok.io"})
public class ReceptionistController {

    private final AppointmentService appointmentService;
    private final PaymentService paymentService;

    // ==================== APPOINTMENT BOOKING ====================

    /**
     * Book walk-in appointment (receptionist)
     */
    @PostMapping("/book-appointment")
    @PreAuthorize("hasRole('RECEPTIONIST')")
    public ResponseEntity<?> bookWalkInAppointment(@RequestBody WalkInBookingRequest request, Authentication auth) {
        try {
            Appointment appointment = new Appointment();
            appointment.setPatientName(request.getPatientName());
            appointment.setPatientPhone(request.getPatientPhone());
            appointment.setDoctorUsername(request.getDoctorUsername());
            appointment.setDoctorName(request.getDoctorName());
            appointment.setSpecialization(request.getSpecialization());
            appointment.setAppointmentDate(request.getAppointmentDate());
            appointment.setPreferredTime(request.getPreferredTime());
            appointment.setReason(request.getReason() != null ? request.getReason() : "Walk-in visit");
            appointment.setStatus(AppointmentStatus.APPROVED); // Walk-in = auto-approved

            Appointment saved = appointmentService.bookAppointment(appointment);
            // Override status to APPROVED since bookAppointment sets PENDING
            saved.setStatus(AppointmentStatus.APPROVED);
            saved = appointmentService.updateStatus(saved.getId(), AppointmentStatus.APPROVED);

            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get available time slots for a doctor
     */
    @GetMapping("/available-slots")
    @PreAuthorize("hasRole('RECEPTIONIST')")
    public ResponseEntity<List<String>> getAvailableSlots(
            @RequestParam String doctorUsername,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<String> slots = appointmentService.getAvailableSlots(doctorUsername, date);
        return ResponseEntity.ok(slots);
    }

    /**
     * Get today's appointments (all doctors)
     */
    @GetMapping("/today-appointments")
    @PreAuthorize("hasRole('RECEPTIONIST')")
    public ResponseEntity<List<Appointment>> getTodayAppointments() {
        List<Appointment> appointments = appointmentService.getAppointmentsByDate(LocalDate.now());
        return ResponseEntity.ok(appointments);
    }

    // ==================== PAYMENT ====================

    /**
     * Record a payment
     */
    @PostMapping("/payment")
    @PreAuthorize("hasRole('RECEPTIONIST')")
    public ResponseEntity<?> recordPayment(@RequestBody PaymentRequest request, Authentication auth) {
        try {
            Payment payment = new Payment();
            payment.setPatientName(request.getPatientName());
            payment.setPatientPhone(request.getPatientPhone());
            payment.setDoctorName(request.getDoctorName());
            payment.setSpecialization(request.getSpecialization());
            payment.setAmount(request.getAmount());
            payment.setPaymentMethod(request.getPaymentMethod());
            payment.setPaymentStatus(Payment.PaymentStatus.COMPLETED);
            payment.setTransactionId(request.getTransactionId());
            payment.setReceptionistUsername(auth.getName());
            payment.setNotes(request.getNotes());

            // Link to appointment if provided
            if (request.getAppointmentId() != null) {
                try {
                    Appointment apt = appointmentService.getAppointmentById(request.getAppointmentId());
                    payment.setAppointment(apt);
                } catch (Exception ignored) {}
            }

            Payment saved = paymentService.createPayment(payment);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all payments recorded by this receptionist
     */
    @GetMapping("/payments")
    @PreAuthorize("hasRole('RECEPTIONIST')")
    public ResponseEntity<List<Payment>> getMyPayments(Authentication auth) {
        List<Payment> payments = paymentService.getPaymentsByReceptionist(auth.getName());
        return ResponseEntity.ok(payments);
    }

    /**
     * Get today's payments
     */
    @GetMapping("/payments/today")
    @PreAuthorize("hasRole('RECEPTIONIST')")
    public ResponseEntity<List<Payment>> getTodayPayments() {
        List<Payment> payments = paymentService.getPaymentsForToday();
        return ResponseEntity.ok(payments);
    }

    /**
     * Get payment by receipt number
     */
    @GetMapping("/payments/receipt/{receiptNumber}")
    @PreAuthorize("hasRole('RECEPTIONIST')")
    public ResponseEntity<?> getPaymentByReceipt(@PathVariable String receiptNumber) {
        return paymentService.getPaymentByReceipt(receiptNumber)
                .map(p -> ResponseEntity.ok((Object) p))
                .orElse(ResponseEntity.notFound().build());
    }

    // ==================== APPOINTMENT REQUESTS (Patient-booked → Receptionist review) ====================

    /**
     * Get all pending + on-hold appointment requests from patients.
     * ON_HOLD appointments remain visible until the receptionist approves or rejects them.
     */
    @GetMapping("/pending-appointments")
    @PreAuthorize("hasRole('RECEPTIONIST')")
    public ResponseEntity<List<Appointment>> getPendingAppointments() {
        List<Appointment> pending = appointmentService.getPendingAndOnHoldAppointments();
        return ResponseEntity.ok(pending);
    }

    /**
     * Receptionist approves a patient-booked appointment (assigns queue number)
     */
    @PutMapping("/appointments/{id}/approve")
    @PreAuthorize("hasRole('RECEPTIONIST')")
    public ResponseEntity<Appointment> approveAppointment(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        String message = (body != null) ? body.get("message") : null;
        Appointment approved = appointmentService.approveAppointment(id, message);
        return ResponseEntity.ok(approved);
    }

    /**
     * Receptionist rejects a patient-booked appointment
     */
    @PutMapping("/appointments/{id}/reject")
    @PreAuthorize("hasRole('RECEPTIONIST')")
    public ResponseEntity<Appointment> rejectAppointment(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        String message = (body != null) ? body.get("message") : null;
        Appointment rejected = appointmentService.rejectAppointment(id, message);
        return ResponseEntity.ok(rejected);
    }

    /**
     * Receptionist puts appointment on hold
     */
    @PutMapping("/appointments/{id}/hold")
    @PreAuthorize("hasRole('RECEPTIONIST')")
    public ResponseEntity<Appointment> holdAppointment(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        String message = (body != null) ? body.get("message") : null;
        Appointment held = appointmentService.holdAppointment(id, message);
        return ResponseEntity.ok(held);
    }

    // ==================== REQUEST DTOs ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WalkInBookingRequest {
        private String patientName;
        private String patientPhone;
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
    public static class PaymentRequest {
        private String patientName;
        private String patientPhone;
        private String doctorName;
        private String specialization;
        private BigDecimal amount;
        private Payment.PaymentMethod paymentMethod;
        private String transactionId;
        private String notes;
        private Long appointmentId;
    }
}
