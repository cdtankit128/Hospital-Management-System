package com.hms.hospitalmanagement.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hms.hospitalmanagement.model.Notification;
import com.hms.hospitalmanagement.service.NotificationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /** Get server time — used by frontend for syncing all clocks/dates */
    @GetMapping("/server-time")
    public ResponseEntity<Map<String, Object>> getServerTime() {
        return ResponseEntity.ok(Map.of(
                "serverTime", LocalDateTime.now().toString(),
                "timestamp", System.currentTimeMillis()
        ));
    }

    /** Get all notifications for the authenticated user */
    @GetMapping
    public ResponseEntity<List<Notification>> getMyNotifications(Authentication auth) {
        String username = auth.getName();
        return ResponseEntity.ok(notificationService.getNotifications(username));
    }

    /** Get only unread notifications */
    @GetMapping("/unread")
    public ResponseEntity<List<Notification>> getUnread(Authentication auth) {
        String username = auth.getName();
        return ResponseEntity.ok(notificationService.getUnreadNotifications(username));
    }

    /** Get notifications by recipient name — used by patients who don't have JWT auth */
    @GetMapping("/by-name")
    public ResponseEntity<List<Notification>> getByName(@RequestParam String name) {
        return ResponseEntity.ok(notificationService.getNotifications(name));
    }

    /** Get unread notifications by recipient name — used by patients */
    @GetMapping("/unread-by-name")
    public ResponseEntity<List<Notification>> getUnreadByName(@RequestParam String name) {
        return ResponseEntity.ok(notificationService.getUnreadNotifications(name));
    }

    /** Count of unread notifications */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication auth) {
        String username = auth.getName();
        long count = notificationService.countUnread(username);
        return ResponseEntity.ok(Map.of("count", count));
    }

    /** Count unread by name — used by patients */
    @GetMapping("/unread-count-by-name")
    public ResponseEntity<Map<String, Long>> getUnreadCountByName(@RequestParam String name) {
        long count = notificationService.countUnread(name);
        return ResponseEntity.ok(Map.of("count", count));
    }

    /** Mark a single notification as read */
    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    /** Mark all notifications for current user as read */
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(Authentication auth) {
        String username = auth.getName();
        notificationService.markAllAsRead(username);
        return ResponseEntity.ok().build();
    }

    /** Mark all notifications as read by name — used by patients */
    @PutMapping("/read-all-by-name")
    public ResponseEntity<Void> markAllAsReadByName(@RequestParam String name) {
        notificationService.markAllAsRead(name);
        return ResponseEntity.ok().build();
    }
}
