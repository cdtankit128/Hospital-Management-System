package com.hms.service;

import com.sendgrid.*;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Attachments;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.util.Base64;

@Service
@Slf4j
public class EmailService {

    private static final String HOSPITAL_NAME = "Chandigarh University Hospital";
    private static final String HOSPITAL_PHONE = "+91 9939339811";

    @Value("${sendgrid.api.key}")
    private String sendGridApiKey;

    @Value("${sendgrid.from.email}")
    private String fromEmail;

    // ==================== CORE SEND METHOD ====================

    public void sendEmail(String to, String subject, String htmlBody) {
        Email from = new Email(fromEmail, HOSPITAL_NAME);
        Email toEmail = new Email(to);
        Content content = new Content("text/html", htmlBody);
        Mail mail = new Mail(from, subject, toEmail, content);

        SendGrid sg = new SendGrid(sendGridApiKey);
        Request request = new Request();

        try {
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());

            Response response = sg.api(request);

            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                log.info("Email sent successfully to {} (status: {})", to, response.getStatusCode());
            } else {
                log.error("SendGrid error (status {}): {}", response.getStatusCode(), response.getBody());
                throw new RuntimeException("SendGrid error (HTTP " + response.getStatusCode() + "): " + response.getBody());
            }
        } catch (IOException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage(), e);
            throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
        }
    }

    // ==================== SEND EMAIL WITH ATTACHMENT ====================

    public void sendEmailWithAttachment(String to, String subject, String htmlBody,
                                         byte[] attachmentBytes, String attachmentFilename) {
        Email from = new Email(fromEmail, HOSPITAL_NAME);
        Email toEmail = new Email(to);
        Content content = new Content("text/html", htmlBody);
        Mail mail = new Mail(from, subject, toEmail, content);

        if (attachmentBytes != null && attachmentBytes.length > 0) {
            Attachments attachment = new Attachments();
            attachment.setContent(Base64.getEncoder().encodeToString(attachmentBytes));
            attachment.setType("application/pdf");
            attachment.setFilename(attachmentFilename != null ? attachmentFilename : "report.pdf");
            attachment.setDisposition("attachment");
            mail.addAttachments(attachment);
        }

        SendGrid sg = new SendGrid(sendGridApiKey);
        Request request = new Request();

        try {
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());

            Response response = sg.api(request);

            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                log.info("Email with attachment sent successfully to {} (status: {})", to, response.getStatusCode());
            } else {
                log.error("SendGrid error (status {}): {}", response.getStatusCode(), response.getBody());
                throw new RuntimeException("SendGrid error (HTTP " + response.getStatusCode() + "): " + response.getBody());
            }
        } catch (IOException e) {
            log.error("Failed to send email with attachment to {}: {}", to, e.getMessage(), e);
            throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
        }
    }

    // ==================== LAB REPORT EMAIL ====================

    public void sendLabReport(String to, String patientName, String testCategory,
                              String doctorName, String remarks,
                              boolean followUpRequired, String followUpDate,
                              byte[] pdfAttachment, String pdfFilename) {
        String subject = "Lab Report — " + testCategory + " — " + HOSPITAL_NAME;
        String body = wrapInTemplate("Lab Report",
                sectionHeader("Patient Information") +
                row("Patient Name", patientName) +
                row("Email", to) +
                sectionHeader("Doctor Information") +
                row("Doctor Name", "Dr. " + doctorName) +
                sectionHeader("Report Details") +
                row("Test Category", "<strong style='color:#1565C0;'>" + testCategory + "</strong>") +
                (remarks != null && !remarks.isEmpty() ? row("Remarks", remarks) : "") +
                row("Follow-up Required", followUpRequired
                        ? "<strong style='color:#E65100;'>Yes</strong>"
                        : "<span style='color:#2E7D32;'>No</span>") +
                (followUpRequired && followUpDate != null && !followUpDate.isEmpty()
                        ? row("Follow-up Date", "<strong style='color:#E65100;'>" + followUpDate + "</strong>") : "") +
                (pdfAttachment != null && pdfAttachment.length > 0
                        ? "<tr><td colspan='2' style='padding:12px 20px; color:#1565C0; font-size:13px; font-weight:600;'>" +
                          "📎 PDF report is attached to this email.</td></tr>" : "") +
                "<tr><td colspan='2' style='padding:16px 20px; color:#64748B; font-size:13px;'>" +
                "Please consult your doctor for interpretation of these results.</td></tr>"
        );

        if (pdfAttachment != null && pdfAttachment.length > 0) {
            sendEmailWithAttachment(to, subject, body, pdfAttachment, pdfFilename);
        } else {
            sendEmail(to, subject, body);
        }
    }

    // ==================== MEDICINE REMINDER EMAIL ====================

    public void sendMedicineReminder(String to, String patientName, String medication, String dosage,
                                     String frequency, String duration, String doctorName, String instructions) {
        String subject = "Medicine Reminder — " + HOSPITAL_NAME;
        String body = wrapInTemplate("Medicine Reminder",
                row("Patient Name", patientName) +
                row("Medication", "<strong style='color:#1565C0;'>" + medication + "</strong>") +
                row("Dosage", dosage) +
                row("Frequency", frequency) +
                row("Duration", duration) +
                row("Prescribed By", "Dr. " + doctorName) +
                (instructions != null && !instructions.isEmpty() ? row("Instructions", instructions) : "") +
                "<tr><td colspan='2' style='padding:16px 20px; color:#64748B; font-size:13px;'>" +
                "Please follow the prescribed schedule. Contact the hospital if you experience any side effects.</td></tr>"
        );
        sendEmail(to, subject, body);
    }

    // ==================== DISCHARGE SUMMARY EMAIL ====================

    public void sendDischargeSummary(String to, String patientName, String diagnosis, String treatment,
                                     String admissionDate, String dischargeDate, String doctorName,
                                     String followUpDate, String instructions) {
        String subject = "Discharge Summary — " + HOSPITAL_NAME;
        String body = wrapInTemplate("Discharge Summary",
                row("Patient Name", patientName) +
                row("Diagnosis", diagnosis) +
                row("Treatment", treatment) +
                row("Admission Date", admissionDate) +
                row("Discharge Date", dischargeDate) +
                row("Attending Doctor", "Dr. " + doctorName) +
                (followUpDate != null && !followUpDate.isEmpty() ?
                    row("Follow-up Date", "<strong style='color:#E65100;'>" + followUpDate + "</strong>") : "") +
                (instructions != null && !instructions.isEmpty() ? row("Instructions", instructions) : "") +
                "<tr><td colspan='2' style='padding:16px 20px; color:#64748B; font-size:13px;'>" +
                "Please keep this summary for your records. Follow all post-discharge instructions carefully.</td></tr>"
        );
        sendEmail(to, subject, body);
    }

    // ==================== APPOINTMENT EMAILS ====================

    public void sendAppointmentApproved(String to, String patientName, String doctorName,
                                         String date, String time, String message) {
        String subject = "Appointment Approved — " + HOSPITAL_NAME;
        String body = wrapInTemplate("Appointment Approved ✓",
                row("Patient", patientName) +
                row("Doctor", "Dr. " + doctorName) +
                row("Date", date) +
                row("Time", time != null ? time : "To be confirmed") +
                (message != null && !message.isEmpty() ? row("Doctor's Message", message) : "") +
                "<tr><td colspan='2' style='padding:16px 20px; color:#2E7D32; font-size:14px; font-weight:600;'>" +
                "Your appointment has been confirmed. Please arrive 10 minutes early.</td></tr>"
        );
        sendEmail(to, subject, body);
    }

    public void sendAppointmentRejected(String to, String patientName, String doctorName,
                                         String date, String message) {
        String subject = "Appointment Update — " + HOSPITAL_NAME;
        String body = wrapInTemplate("Appointment Update",
                row("Patient", patientName) +
                row("Doctor", "Dr. " + doctorName) +
                row("Requested Date", date) +
                row("Status", "<strong style='color:#C62828;'>Not Available</strong>") +
                (message != null && !message.isEmpty() ? row("Doctor's Message", message) : "") +
                "<tr><td colspan='2' style='padding:16px 20px; color:#64748B; font-size:13px;'>" +
                "Please book another slot or contact the hospital for assistance.</td></tr>"
        );
        sendEmail(to, subject, body);
    }

    // ==================== CUSTOM EMAIL ====================

    public void sendCustomEmail(String to, String subject, String messageBody, String doctorName) {
        String body = wrapInTemplate("Message from Dr. " + doctorName,
                "<tr><td colspan='2' style='padding:20px; color:#334155; font-size:14px; line-height:1.7;'>" +
                messageBody.replace("\n", "<br/>") + "</td></tr>"
        );
        sendEmail(to, subject, body);
    }

    // ==================== HTML TEMPLATE HELPERS ====================

    private String wrapInTemplate(String title, String contentRows) {
        return "<!DOCTYPE html><html><head><meta charset='UTF-8'></head><body style='margin:0;padding:0;background:#F1F5F9;font-family:Arial,sans-serif;'>" +
                "<table width='100%' cellpadding='0' cellspacing='0' style='background:#F1F5F9;padding:32px 0;'>" +
                "<tr><td align='center'>" +
                "<table width='600' cellpadding='0' cellspacing='0' style='background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);'>" +
                // Header
                "<tr><td style='background:linear-gradient(135deg,#1565C0,#0D47A1);padding:28px 32px;text-align:center;'>" +
                "<h1 style='color:white;margin:0;font-size:22px;font-weight:700;letter-spacing:0.5px;'>" + HOSPITAL_NAME + "</h1>" +
                "<p style='color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;'>Hospital Management System</p>" +
                "</td></tr>" +
                // Title bar
                "<tr><td style='background:#E3F2FD;padding:14px 32px;border-bottom:2px solid #1565C0;'>" +
                "<h2 style='margin:0;color:#0D47A1;font-size:17px;font-weight:700;'>" + title + "</h2>" +
                "</td></tr>" +
                // Content
                "<tr><td style='padding:8px 12px;'>" +
                "<table width='100%' cellpadding='0' cellspacing='0'>" +
                contentRows +
                "</table>" +
                "</td></tr>" +
                // Footer
                "<tr><td style='background:#F8FAFC;padding:20px 32px;border-top:1px solid #E2E8F0;text-align:center;'>" +
                "<p style='margin:0;color:#94A3B8;font-size:12px;'>" + HOSPITAL_NAME + " | " + HOSPITAL_PHONE + "</p>" +
                "<p style='margin:4px 0 0;color:#CBD5E1;font-size:11px;'>This is an automated email. Please do not reply directly.</p>" +
                "</td></tr>" +
                "</table></td></tr></table></body></html>";
    }

    private String row(String label, String value) {
        return "<tr>" +
                "<td style='padding:10px 20px;color:#64748B;font-size:13px;font-weight:600;width:140px;vertical-align:top;border-bottom:1px solid #F1F5F9;'>" + label + "</td>" +
                "<td style='padding:10px 20px;color:#334155;font-size:14px;border-bottom:1px solid #F1F5F9;'>" + (value != null ? value : "N/A") + "</td>" +
                "</tr>";
    }

    private String sectionHeader(String title) {
        return "<tr><td colspan='2' style='padding:14px 20px 6px;background:#F8FAFC;border-bottom:2px solid #E2E8F0;'>" +
                "<strong style='color:#0D47A1;font-size:14px;letter-spacing:0.5px;'>" + title + "</strong></td></tr>";
    }
}
