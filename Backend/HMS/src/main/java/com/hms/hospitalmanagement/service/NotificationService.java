package com.hms.hospitalmanagement.service;

import java.util.List;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.hms.hospitalmanagement.model.Notification;
import com.hms.hospitalmanagement.model.NotificationType;
import com.hms.hospitalmanagement.repository.NotificationRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Create a notification, persist it, and push it via WebSocket to the recipient.
     */
    public Notification sendNotification(String recipientUsername, String recipientRole,
                                          String title, String message,
                                          NotificationType type, Long referenceId) {
        Notification notif = new Notification();
        notif.setRecipientUsername(recipientUsername);
        notif.setRecipientRole(recipientRole);
        notif.setTitle(title);
        notif.setMessage(message);
        notif.setType(type);
        notif.setReferenceId(referenceId);
        notif.setRead(false);

        Notification saved = notificationRepository.save(notif);

        // Push real-time via WebSocket to /topic/notifications/{username}
        try {
            messagingTemplate.convertAndSend(
                    "/topic/notifications/" + recipientUsername,
                    saved
            );
            log.info("WebSocket notification sent to topic for user: {}", recipientUsername);
        } catch (Exception e) {
            log.warn("Failed to send WebSocket notification to {}: {}", recipientUsername, e.getMessage());
        }

        return saved;
    }

    /** Get all notifications for a user (newest first) */
    public List<Notification> getNotifications(String username) {
        return notificationRepository.findByRecipientUsernameOrderByCreatedAtDesc(username);
    }

    /** Get unread notifications for a user */
    public List<Notification> getUnreadNotifications(String username) {
        return notificationRepository.findByRecipientUsernameAndReadFalseOrderByCreatedAtDesc(username);
    }

    /** Count unread */
    public long countUnread(String username) {
        return notificationRepository.countByRecipientUsernameAndReadFalse(username);
    }

    /** Mark a single notification as read */
    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    /** Mark all notifications for a user as read */
    public void markAllAsRead(String username) {
        List<Notification> unread = notificationRepository
                .findByRecipientUsernameAndReadFalseOrderByCreatedAtDesc(username);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }
}
