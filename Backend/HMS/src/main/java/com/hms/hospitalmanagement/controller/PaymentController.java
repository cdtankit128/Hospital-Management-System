package com.hms.hospitalmanagement.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.json.JSONObject;
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
import org.springframework.web.bind.annotation.RestController;

import com.hms.hospitalmanagement.model.Appointment;
import com.hms.hospitalmanagement.model.Payment;
import com.hms.hospitalmanagement.service.AppointmentService;
import com.hms.hospitalmanagement.service.PaymentService;
import com.hms.hospitalmanagement.service.RazorpayService;
import com.razorpay.Order;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = {"http://localhost:*", "https://localhost:*", "http://192.168.*.*:*", "https://*.ngrok-free.app", "https://*.ngrok-free.dev", "https://*.ngrok.io"})
public class PaymentController {

    private final PaymentService paymentService;
    private final AppointmentService appointmentService;
    private final RazorpayService razorpayService;

    // ==================== PUBLIC ENDPOINTS (Patient Payments) ====================

    /**
     * Get Razorpay Key ID for frontend checkout initialization.
     */
    @GetMapping("/razorpay/key")
    public ResponseEntity<?> getRazorpayKey() {
        return ResponseEntity.ok(Map.of("keyId", razorpayService.getKeyId()));
    }

    /**
     * Create a Razorpay order and a PENDING payment record.
     * Frontend uses the returned razorpayOrderId to open Razorpay Checkout.
     */
    @PostMapping("/razorpay/create-order")
    public ResponseEntity<?> createRazorpayOrder(@RequestBody CreateOrderRequest request) {
        try {
            // Create Razorpay order
            JSONObject notes = new JSONObject();
            notes.put("patientName", request.getPatientName());
            notes.put("patientPhone", request.getPatientPhone());
            notes.put("doctorName", request.getDoctorName());
            if (request.getAppointmentId() != null) {
                notes.put("appointmentId", request.getAppointmentId());
            }

            String receipt = "RCP" + System.currentTimeMillis();
            Order razorpayOrder = razorpayService.createOrder(
                    request.getAmount(), "INR", receipt, notes);

            String razorpayOrderId = razorpayOrder.get("id");

            // Create PENDING payment record in our DB
            Payment payment = new Payment();
            payment.setReceiptNumber(receipt);
            payment.setPatientName(request.getPatientName());
            payment.setPatientPhone(request.getPatientPhone());
            payment.setDoctorName(request.getDoctorName());
            payment.setSpecialization(request.getSpecialization());
            payment.setAmount(request.getAmount());
            payment.setPaymentMethod(Payment.PaymentMethod.ONLINE);
            payment.setPaymentStatus(Payment.PaymentStatus.PENDING);
            payment.setRazorpayOrderId(razorpayOrderId);
            payment.setNotes(request.getNotes());
            payment.setReceptionistUsername(request.getReceptionistUsername() != null ? request.getReceptionistUsername() : "SELF");
            payment.setPayerType(request.getPayerType() != null ? request.getPayerType() : "PATIENT");

            // Link to appointment if provided
            if (request.getAppointmentId() != null) {
                try {
                    Appointment apt = appointmentService.getAppointmentById(request.getAppointmentId());
                    payment.setAppointment(apt);
                } catch (Exception ignored) {}
            }

            Payment saved = paymentService.createOrder(payment);

            // Return both the payment record and the Razorpay order details
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "payment", saved,
                    "razorpayOrderId", razorpayOrderId,
                    "razorpayKeyId", razorpayService.getKeyId(),
                    "amount", request.getAmount().multiply(BigDecimal.valueOf(100)).intValue(),
                    "currency", "INR"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to create Razorpay order: " + e.getMessage()));
        }
    }

    /**
     * Verify Razorpay payment after checkout completion.
     * Validates the HMAC signature and marks the payment as COMPLETED.
     */
    @PostMapping("/razorpay/verify")
    public ResponseEntity<?> verifyRazorpayPayment(@RequestBody RazorpayVerifyRequest request) {
        try {
            // Verify the signature
            boolean isValid = razorpayService.verifyPaymentSignature(
                    request.getRazorpayOrderId(),
                    request.getRazorpayPaymentId(),
                    request.getRazorpaySignature());

            if (!isValid) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Payment verification failed. Invalid signature.",
                        "verified", false
                ));
            }

            // Find the payment by razorpayOrderId and mark as COMPLETED
            Payment payment = paymentService.getPaymentByRazorpayOrderId(request.getRazorpayOrderId());
            if (payment == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Payment record not found for order: " + request.getRazorpayOrderId(),
                        "verified", false
                ));
            }

            payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
            payment.setRazorpaySignature(request.getRazorpaySignature());
            payment.setTransactionId(request.getRazorpayPaymentId());

            Payment confirmed = paymentService.confirmPayment(payment.getId(), request.getRazorpayPaymentId());

            return ResponseEntity.ok(Map.of(
                    "verified", true,
                    "payment", confirmed,
                    "message", "Payment verified and completed successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Payment verification error: " + e.getMessage(),
                    "verified", false
            ));
        }
    }

    /**
     * Create a payment order for an appointment (patient-initiated).
     * Returns a payment with PENDING status — patient then confirms after paying.
     */
    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestBody CreateOrderRequest request) {
        try {
            Payment payment = new Payment();
            payment.setPatientName(request.getPatientName());
            payment.setPatientPhone(request.getPatientPhone());
            payment.setDoctorName(request.getDoctorName());
            payment.setSpecialization(request.getSpecialization());
            payment.setAmount(request.getAmount());
            payment.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : Payment.PaymentMethod.ONLINE);
            payment.setPaymentStatus(Payment.PaymentStatus.PENDING);
            payment.setNotes(request.getNotes());
            payment.setReceptionistUsername(request.getReceptionistUsername() != null ? request.getReceptionistUsername() : "SELF");
            payment.setPayerType(request.getPayerType() != null ? request.getPayerType() : "PATIENT");

            // Link to appointment if provided
            if (request.getAppointmentId() != null) {
                try {
                    Appointment apt = appointmentService.getAppointmentById(request.getAppointmentId());
                    payment.setAppointment(apt);
                } catch (Exception ignored) {}
            }

            Payment saved = paymentService.createOrder(payment);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Confirm a pending payment order (patient confirms after completing payment).
     */
    @PutMapping("/{paymentId}/confirm")
    public ResponseEntity<?> confirmPayment(
            @PathVariable Long paymentId,
            @RequestBody(required = false) ConfirmPaymentRequest request) {
        try {
            String transactionId = (request != null && request.getTransactionId() != null)
                    ? request.getTransactionId()
                    : "TXN-" + System.currentTimeMillis();
            Payment confirmed = paymentService.confirmPayment(paymentId, transactionId);
            return ResponseEntity.ok(confirmed);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get payment details by appointment ID (public — patients check their payment status).
     */
    @GetMapping("/by-appointment/{appointmentId}")
    public ResponseEntity<?> getPaymentByAppointment(@PathVariable Long appointmentId) {
        return paymentService.getPaymentByAppointmentId(appointmentId)
                .map(p -> ResponseEntity.ok((Object) p))
                .orElse(ResponseEntity.ok(Map.of("message", "No payment found for this appointment")));
    }

    /**
     * Get payments by patient phone (public — patient dashboard).
     */
    @GetMapping("/by-phone/{phone}")
    public ResponseEntity<List<Payment>> getPaymentsByPhone(@PathVariable String phone) {
        List<Payment> payments = paymentService.getPaymentsByPatientPhone(phone);
        return ResponseEntity.ok(payments);
    }

    /**
     * Get payments by patient name (public — patient dashboard).
     */
    @GetMapping("/by-name/{name}")
    public ResponseEntity<List<Payment>> getPaymentsByName(@PathVariable String name) {
        List<Payment> payments = paymentService.getPaymentsByPatientName(name);
        return ResponseEntity.ok(payments);
    }

    /**
     * Get payment by receipt number (public).
     */
    @GetMapping("/receipt/{receiptNumber}")
    public ResponseEntity<?> getPaymentByReceipt(@PathVariable String receiptNumber) {
        return paymentService.getPaymentByReceipt(receiptNumber)
                .map(p -> ResponseEntity.ok((Object) p))
                .orElse(ResponseEntity.notFound().build());
    }

    // ==================== REFUND ENDPOINTS ====================

    /**
     * Request a refund for a payment (public — patient can request refund).
     * For ONLINE Razorpay payments, processes refund via Razorpay API.
     */
    @PutMapping("/{paymentId}/refund")
    public ResponseEntity<?> refundPayment(
            @PathVariable Long paymentId,
            @RequestBody(required = false) RefundRequest request) {
        try {
            String reason = (request != null && request.getReason() != null) ? request.getReason() : "Refund requested";
            Payment payment = paymentService.getPaymentById(paymentId)
                    .orElseThrow(() -> new RuntimeException("Payment not found"));

            // If it's an ONLINE payment with Razorpay payment ID, process refund via Razorpay
            if (payment.getPaymentMethod() == Payment.PaymentMethod.ONLINE
                    && payment.getRazorpayPaymentId() != null
                    && !payment.getRazorpayPaymentId().isEmpty()) {
                try {
                    com.razorpay.Refund razorpayRefund = razorpayService.processRefund(
                            payment.getRazorpayPaymentId(), payment.getAmount());
                    String refundId = razorpayRefund.get("id");
                    // Update payment with Razorpay refund ID
                    Payment refunded = paymentService.refundPayment(paymentId, reason);
                    refunded.setRefundTransactionId(refundId);
                    // Save the updated refund transaction ID
                    return ResponseEntity.ok(refunded);
                } catch (Exception razorpayEx) {
                    // If Razorpay refund fails, still mark as refunded locally with error note
                    Payment refunded = paymentService.refundPayment(paymentId, reason + " (Razorpay refund error: " + razorpayEx.getMessage() + ")");
                    return ResponseEntity.ok(refunded);
                }
            }

            Payment refunded = paymentService.refundPayment(paymentId, reason);
            return ResponseEntity.ok(refunded);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== RECEPTIONIST ENDPOINTS ====================

    /**
     * Receptionist records a direct payment (COMPLETED immediately).
     */
    @PostMapping("/record")
    @PreAuthorize("hasRole('RECEPTIONIST')")
    public ResponseEntity<?> recordPayment(@RequestBody RecordPaymentRequest request, Authentication auth) {
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
            payment.setPayerType("RECEPTIONIST");

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
     * Get all payments (receptionist).
     */
    @GetMapping("/all")
    @PreAuthorize("hasRole('RECEPTIONIST') or hasRole('ADMIN')")
    public ResponseEntity<List<Payment>> getAllPayments() {
        return ResponseEntity.ok(paymentService.getAllPayments());
    }

    /**
     * Get today's payments (receptionist).
     */
    @GetMapping("/today")
    @PreAuthorize("hasRole('RECEPTIONIST') or hasRole('ADMIN')")
    public ResponseEntity<List<Payment>> getTodayPayments() {
        return ResponseEntity.ok(paymentService.getPaymentsForToday());
    }

    // ==================== REQUEST DTOs ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateOrderRequest {
        private String patientName;
        private String patientPhone;
        private String doctorName;
        private String specialization;
        private BigDecimal amount;
        private Payment.PaymentMethod paymentMethod;
        private String notes;
        private Long appointmentId;
        private String receptionistUsername;
        private String payerType; // PATIENT or RECEPTIONIST
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConfirmPaymentRequest {
        private String transactionId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RefundRequest {
        private String reason;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecordPaymentRequest {
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

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RazorpayVerifyRequest {
        private String razorpayOrderId;
        private String razorpayPaymentId;
        private String razorpaySignature;
    }
}
