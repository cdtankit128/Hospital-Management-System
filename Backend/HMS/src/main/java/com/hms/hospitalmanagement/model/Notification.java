package com.hms.hospitalmanagement.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The username (doctor/patient/receptionist) who should see this notification */
    @Column(name = "recipient_username", nullable = false)
    private String recipientUsername;

    /** The role of the recipient (DOCTOR, PATIENT, RECEPTIONIST) */
    @Column(name = "recipient_role", nullable = false)
    private String recipientRole;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "type", nullable = false)
    @Enumerated(EnumType.STRING)
    private NotificationType type;

    /** Whether the user has seen/read this notification */
    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    /** Related entity ID (e.g. appointment ID) for navigation */
    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
