package com.hms.controller;

import com.hms.service.EmailService;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/email")
@RequiredArgsConstructor
public class EmailController {

    private final EmailService emailService;

    // ==================== TEST ENDPOINT ====================

    @PostMapping("/test")
    public ResponseEntity<?> sendTestEmail(@RequestBody Map<String, String> request) {
        try {
            String to = request.get("to");
            String subject = request.getOrDefault("subject", "Test Email from HMS");
            String body = request.getOrDefault("body", "<h1>Hello!</h1><p>This is a test email from the Hospital Management System.</p>");

            emailService.sendEmail(to, subject, body);
            return ResponseEntity.ok(Map.of("success", true, "message", "Test email sent successfully to " + to));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", "Failed to send email: " + e.getMessage()));
        }
    }

    // ==================== LAB REPORT ====================

    @PostMapping(value = "/lab-report", consumes = "multipart/form-data")
    public ResponseEntity<?> sendLabReport(
            @RequestParam("to") String to,
            @RequestParam("patientName") String patientName,
            @RequestParam("doctorName") String doctorName,
            @RequestParam("testCategory") String testCategory,
            @RequestParam(value = "remarks", required = false, defaultValue = "") String remarks,
            @RequestParam(value = "followUpRequired", required = false, defaultValue = "false") boolean followUpRequired,
            @RequestParam(value = "followUpDate", required = false, defaultValue = "") String followUpDate,
            @RequestParam(value = "reportPdf", required = false) MultipartFile reportPdf
    ) {
        try {
            byte[] pdfBytes = null;
            String pdfFilename = null;
            if (reportPdf != null && !reportPdf.isEmpty()) {
                pdfBytes = reportPdf.getBytes();
                pdfFilename = reportPdf.getOriginalFilename();
            }
            emailService.sendLabReport(
                    to, patientName, testCategory,
                    doctorName, remarks,
                    followUpRequired, followUpDate,
                    pdfBytes, pdfFilename
            );
            return ResponseEntity.ok(Map.of("success", true, "message", "Lab report email sent to " + to));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", "Failed: " + e.getMessage()));
        }
    }

    // ==================== MEDICINE REMINDER ====================

    @PostMapping("/medicine-reminder")
    public ResponseEntity<?> sendMedicineReminder(@RequestBody MedicineReminderRequest request) {
        try {
            emailService.sendMedicineReminder(
                    request.getTo(), request.getPatientName(), request.getMedication(),
                    request.getDosage(), request.getFrequency(), request.getDuration(),
                    request.getDoctorName(), request.getInstructions()
            );
            return ResponseEntity.ok(Map.of("success", true, "message", "Medicine reminder sent to " + request.getTo()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", "Failed: " + e.getMessage()));
        }
    }

    // ==================== DISCHARGE SUMMARY ====================

    @PostMapping("/discharge-summary")
    public ResponseEntity<?> sendDischargeSummary(@RequestBody DischargeSummaryRequest request) {
        try {
            emailService.sendDischargeSummary(
                    request.getTo(), request.getPatientName(), request.getDiagnosis(),
                    request.getTreatment(), request.getAdmissionDate(), request.getDischargeDate(),
                    request.getDoctorName(), request.getFollowUpDate(), request.getInstructions()
            );
            return ResponseEntity.ok(Map.of("success", true, "message", "Discharge summary sent to " + request.getTo()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", "Failed: " + e.getMessage()));
        }
    }

    // ==================== CUSTOM EMAIL ====================

    @PostMapping("/send")
    public ResponseEntity<?> sendCustomEmail(@RequestBody CustomEmailRequest request) {
        try {
            emailService.sendCustomEmail(
                    request.getTo(), request.getSubject(), request.getMessage(), request.getDoctorName()
            );
            return ResponseEntity.ok(Map.of("success", true, "message", "Email sent to " + request.getTo()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", "Failed: " + e.getMessage()));
        }
    }

    // ==================== DTOs ====================

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class LabReportRequest {
        private String to;
        private String patientName;
        private String doctorName;
        private String testCategory;
        private String remarks;
        private boolean followUpRequired;
        private String followUpDate;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class MedicineReminderRequest {
        private String to;
        private String patientName;
        private String medication;
        private String dosage;
        private String frequency;
        private String duration;
        private String doctorName;
        private String instructions;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class DischargeSummaryRequest {
        private String to;
        private String patientName;
        private String diagnosis;
        private String treatment;
        private String admissionDate;
        private String dischargeDate;
        private String doctorName;
        private String followUpDate;
        private String instructions;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class CustomEmailRequest {
        private String to;
        private String subject;
        private String message;
        private String doctorName;
    }
}
