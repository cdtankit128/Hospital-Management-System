package com.hms.hospitalmanagement.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hms.hospitalmanagement.model.Payment;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByReceiptNumber(String receiptNumber);
    List<Payment> findByReceptionistUsernameOrderByCreatedAtDesc(String receptionistUsername);
    List<Payment> findByPatientPhoneOrderByCreatedAtDesc(String patientPhone);
    List<Payment> findByPatientNameContainingIgnoreCaseOrderByCreatedAtDesc(String patientName);
    List<Payment> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime start, LocalDateTime end);
    List<Payment> findAllByOrderByCreatedAtDesc();
    boolean existsByReceiptNumber(String receiptNumber);
    Optional<Payment> findByAppointmentId(Long appointmentId);
    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);
    List<Payment> findByAppointmentIdIn(List<Long> appointmentIds);
    List<Payment> findByPaymentStatusOrderByCreatedAtDesc(Payment.PaymentStatus status);
}
