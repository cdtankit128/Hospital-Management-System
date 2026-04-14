package com.hms.hospitalmanagement.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hms.hospitalmanagement.model.NotificationType;
import com.hms.hospitalmanagement.model.Payment;
import com.hms.hospitalmanagement.repository.PaymentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final NotificationService notificationService;

    /**
     * Create a payment order (status = PENDING until confirmed)
     */
    public Payment createOrder(Payment payment) {
        if (payment.getReceiptNumber() == null || payment.getReceiptNumber().isEmpty()) {
            payment.setReceiptNumber(generateReceiptNumber());
        }
        payment.setPaymentStatus(Payment.PaymentStatus.PENDING);
        return paymentRepository.save(payment);
    }

    /**
     * Create and immediately complete a payment (receptionist cash/QR)
     */
    public Payment createPayment(Payment payment) {
        if (payment.getReceiptNumber() == null || payment.getReceiptNumber().isEmpty()) {
            payment.setReceiptNumber(generateReceiptNumber());
        }
        if (payment.getPaymentStatus() == null) {
            payment.setPaymentStatus(Payment.PaymentStatus.COMPLETED);
        }
        return paymentRepository.save(payment);
    }

    /**
     * Confirm a pending payment order (marks as COMPLETED)
     */
    @Transactional
    public Payment confirmPayment(Long paymentId, String transactionId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found with id: " + paymentId));

        if (payment.getPaymentStatus() != Payment.PaymentStatus.PENDING) {
            throw new RuntimeException("Payment is not in PENDING state. Current status: " + payment.getPaymentStatus());
        }

        payment.setPaymentStatus(Payment.PaymentStatus.COMPLETED);
        if (transactionId != null && !transactionId.isEmpty()) {
            payment.setTransactionId(transactionId);
        }
        Payment saved = paymentRepository.save(payment);

        // Send notification to receptionists about payment
        notificationService.sendNotification(
                saved.getReceptionistUsername() != null ? saved.getReceptionistUsername() : "reception",
                "RECEPTIONIST",
                "Payment Received",
                "₹" + saved.getAmount() + " payment completed for " + saved.getPatientName() + " (Receipt: " + saved.getReceiptNumber() + ")",
                NotificationType.PAYMENT_RECORDED, saved.getId());

        return saved;
    }

    /**
     * Refund a completed payment
     */
    @Transactional
    public Payment refundPayment(Long paymentId, String refundReason) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found with id: " + paymentId));

        if (payment.getPaymentStatus() != Payment.PaymentStatus.COMPLETED) {
            throw new RuntimeException("Only COMPLETED payments can be refunded. Current status: " + payment.getPaymentStatus());
        }

        payment.setPaymentStatus(Payment.PaymentStatus.REFUNDED);
        payment.setRefundReason(refundReason != null ? refundReason : "Refund requested");
        payment.setRefundedAt(LocalDateTime.now());
        payment.setRefundTransactionId("RFD-" + System.currentTimeMillis());
        Payment saved = paymentRepository.save(payment);

        // Notify patient about refund
        if (saved.getPatientName() != null) {
            notificationService.sendNotification(
                    saved.getPatientName(), "PATIENT",
                    "Payment Refunded",
                    "Your payment of ₹" + saved.getAmount() + " (Receipt: " + saved.getReceiptNumber() + ") has been refunded. Reason: " + (refundReason != null ? refundReason : "N/A"),
                    NotificationType.PAYMENT_RECORDED, saved.getId());
        }

        return saved;
    }

    public Optional<Payment> getPaymentById(Long id) {
        return paymentRepository.findById(id);
    }

    public Optional<Payment> getPaymentByReceipt(String receiptNumber) {
        return paymentRepository.findByReceiptNumber(receiptNumber);
    }

    public List<Payment> getPaymentsByReceptionist(String receptionistUsername) {
        return paymentRepository.findByReceptionistUsernameOrderByCreatedAtDesc(receptionistUsername);
    }

    public List<Payment> getPaymentsByPatientPhone(String phone) {
        return paymentRepository.findByPatientPhoneOrderByCreatedAtDesc(phone);
    }

    public List<Payment> getPaymentsByPatientName(String name) {
        return paymentRepository.findByPatientNameContainingIgnoreCaseOrderByCreatedAtDesc(name);
    }

    public Optional<Payment> getPaymentByAppointmentId(Long appointmentId) {
        return paymentRepository.findByAppointmentId(appointmentId);
    }

    public Payment getPaymentByRazorpayOrderId(String razorpayOrderId) {
        return paymentRepository.findByRazorpayOrderId(razorpayOrderId).orElse(null);
    }

    public List<Payment> getPaymentsForToday() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        return paymentRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(startOfDay, endOfDay);
    }

    public List<Payment> getAllPayments() {
        return paymentRepository.findAllByOrderByCreatedAtDesc();
    }

    private String generateReceiptNumber() {
        String prefix = "RCP";
        long timestamp = System.currentTimeMillis() % 1000000;
        int random = ThreadLocalRandom.current().nextInt(100, 999);
        String receipt = prefix + timestamp + random;
        // Ensure uniqueness
        while (paymentRepository.existsByReceiptNumber(receipt)) {
            random = ThreadLocalRandom.current().nextInt(100, 999);
            receipt = prefix + timestamp + random;
        }
        return receipt;
    }
}
