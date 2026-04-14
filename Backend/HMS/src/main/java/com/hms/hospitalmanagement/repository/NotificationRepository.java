package com.hms.hospitalmanagement.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hms.hospitalmanagement.model.Notification;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /** All notifications for a user, newest first */
    List<Notification> findByRecipientUsernameOrderByCreatedAtDesc(String recipientUsername);

    /** Unread notifications for a user */
    List<Notification> findByRecipientUsernameAndReadFalseOrderByCreatedAtDesc(String recipientUsername);

    /** Count unread */
    long countByRecipientUsernameAndReadFalse(String recipientUsername);
}
