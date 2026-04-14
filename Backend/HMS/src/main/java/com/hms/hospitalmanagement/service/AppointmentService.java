package com.hms.hospitalmanagement.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hms.entity.Role;
import com.hms.entity.User;
import com.hms.hospitalmanagement.exception.AppointmentNotFoundException;
import com.hms.hospitalmanagement.model.Appointment;
import com.hms.hospitalmanagement.model.AppointmentStatus;
import com.hms.hospitalmanagement.model.NotificationType;
import com.hms.hospitalmanagement.repository.AppointmentRepository;
import com.hms.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    // Time slots: 9:00 AM to 5:00 PM, 30-min intervals
    private static final String[] ALL_SLOTS = {
        "09:00", "09:30", "10:00", "10:30",
        "11:00", "11:30", "12:00", "12:30",
        "14:00", "14:30", "15:00", "15:30",
        "16:00", "16:30"
    };

    public Appointment createAppointment(Appointment appointment) {
        if (appointment.getStatus() == null) {
            appointment.setStatus(AppointmentStatus.PENDING);
        }
        // Set timeSlot string from appointmentTime
        if (appointment.getAppointmentTime() != null && appointment.getTimeSlot() == null) {
            appointment.setTimeSlot(appointment.getAppointmentTime().toString().substring(0, 5));
        }
        return appointmentRepository.save(appointment);
    }

    public Appointment bookAppointment(Appointment appointment) {
        appointment.setStatus(AppointmentStatus.PENDING);
        if (appointment.getAppointmentTime() != null) {
            appointment.setTimeSlot(appointment.getAppointmentTime().toString().substring(0, 5));
        }
        // Assign global appointment number
        Long nextAppNum = appointmentRepository.findMaxAppointmentNumber() + 1;
        appointment.setAppointmentNumber(nextAppNum);
        Appointment saved = appointmentRepository.save(appointment);

        // Notify doctor about new appointment
        if (saved.getDoctorUsername() != null) {
            notificationService.sendNotification(
                    saved.getDoctorUsername(), "DOCTOR",
                    "New Appointment Booked",
                    saved.getPatientName() + " booked an appointment for " + saved.getAppointmentDate(),
                    NotificationType.APPOINTMENT_BOOKED, saved.getId());
        }
        // Notify all receptionists about new pending appointment
        List<User> receptionists = userRepository.findByRole(Role.RECEPTIONIST);
        for (User receptionist : receptionists) {
            notificationService.sendNotification(
                    receptionist.getUsername(), "RECEPTIONIST",
                    "New Appointment Request",
                    saved.getPatientName() + " requested an appointment with Dr. " + saved.getDoctorName() + " on " + saved.getAppointmentDate(),
                    NotificationType.APPOINTMENT_BOOKED, saved.getId());
        }

        return saved;
    }

    public List<String> getAvailableSlots(String doctorUsername, LocalDate date) {
        // Get all non-cancelled/rejected appointments for this doctor on this date
        List<Appointment> booked = appointmentRepository.findByDoctorUsernameAndAppointmentDateAndStatusNot(
                doctorUsername, date, AppointmentStatus.CANCELLED
        );
        // Filter out rejected ones too
        List<String> bookedSlots = new ArrayList<>();
        for (Appointment a : booked) {
            if (a.getStatus() != AppointmentStatus.REJECTED) {
                bookedSlots.add(a.getAppointmentTime().toString().substring(0, 5));
            }
        }
        List<String> available = new ArrayList<>();
        for (String slot : ALL_SLOTS) {
            if (!bookedSlots.contains(slot)) {
                available.add(slot);
            }
        }
        return available;
    }

    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    public Appointment getAppointmentById(Long id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new AppointmentNotFoundException(id));
    }

    public List<Appointment> getAppointmentsByPatient(Long patientId) {
        return appointmentRepository.findByPatientId(patientId);
    }

    public List<Appointment> getAppointmentsByDoctor(Long doctorId) {
        return appointmentRepository.findByDoctorId(doctorId);
    }

    public List<Appointment> getAppointmentsByDoctorUsername(String doctorUsername) {
        return appointmentRepository.findByDoctorUsernameOrderByAppointmentDateDescAppointmentTimeDesc(doctorUsername);
    }

    public List<Appointment> getPendingByDoctorUsername(String doctorUsername) {
        return appointmentRepository.findByDoctorUsernameAndStatusOrderByAppointmentDateAscAppointmentTimeAsc(
                doctorUsername, AppointmentStatus.PENDING);
    }

    public List<Appointment> getAppointmentsByPatientPhone(String phone) {
        return appointmentRepository.findByPatientPhoneOrderByAppointmentDateDescAppointmentTimeDesc(phone);
    }

    public List<Appointment> getAppointmentsByPatientName(String name) {
        // Combine case-insensitive name match + phone match to cover all bookings
        List<Appointment> byName = appointmentRepository.findByPatientNameIgnoreCaseOrderByDateDesc(name);
        List<Appointment> byPhone = appointmentRepository.findByPatientPhoneOrderByAppointmentDateDescAppointmentTimeDesc(name);
        // Merge without duplicates
        java.util.Set<Long> seenIds = new java.util.HashSet<>();
        List<Appointment> merged = new ArrayList<>();
        for (Appointment a : byName) {
            if (seenIds.add(a.getId())) merged.add(a);
        }
        for (Appointment a : byPhone) {
            if (seenIds.add(a.getId())) merged.add(a);
        }
        return merged;
    }

    public List<Appointment> getAppointmentsByStatus(AppointmentStatus status) {
        return appointmentRepository.findByStatus(status);
    }

    public List<Appointment> getAppointmentsByDate(LocalDate date) {
        return appointmentRepository.findByAppointmentDate(date);
    }

    public Appointment approveAppointment(Long id, String doctorMessage) {
        Appointment appointment = getAppointmentById(id);
        appointment.setStatus(AppointmentStatus.APPROVED);
        if (doctorMessage != null && !doctorMessage.trim().isEmpty()) {
            appointment.setDoctorMessage(doctorMessage);
        }
        // Assign queue number for this doctor on this date
        int currentQueue = appointmentRepository.countQueueForDoctorOnDate(
                appointment.getDoctorUsername(), appointment.getAppointmentDate());
        appointment.setQueueNumber(currentQueue + 1);
        Appointment saved = appointmentRepository.save(appointment);

        // Notify patient
        if (saved.getPatientName() != null) {
            notificationService.sendNotification(
                    saved.getPatientName(), "PATIENT",
                    "Appointment Approved ✓",
                    "Your appointment with Dr. " + saved.getDoctorName() + " on " + saved.getAppointmentDate() + " has been approved. Queue #" + saved.getQueueNumber(),
                    NotificationType.APPOINTMENT_APPROVED, saved.getId());
        }
        // Notify doctor
        if (saved.getDoctorUsername() != null) {
            notificationService.sendNotification(
                    saved.getDoctorUsername(), "DOCTOR",
                    "Appointment Approved",
                    saved.getPatientName() + " — Queue #" + saved.getQueueNumber() + " on " + saved.getAppointmentDate(),
                    NotificationType.APPOINTMENT_APPROVED, saved.getId());
        }

        return saved;
    }

    public Appointment rejectAppointment(Long id, String doctorMessage) {
        Appointment appointment = getAppointmentById(id);
        appointment.setStatus(AppointmentStatus.REJECTED);
        if (doctorMessage != null && !doctorMessage.trim().isEmpty()) {
            appointment.setDoctorMessage(doctorMessage);
        }
        Appointment saved = appointmentRepository.save(appointment);

        // Notify patient
        if (saved.getPatientName() != null) {
            String msg = "Your appointment with Dr. " + saved.getDoctorName() + " on " + saved.getAppointmentDate() + " has been rejected.";
            if (doctorMessage != null && !doctorMessage.trim().isEmpty()) {
                msg += " Reason: " + doctorMessage;
            }
            notificationService.sendNotification(
                    saved.getPatientName(), "PATIENT",
                    "Appointment Rejected",
                    msg, NotificationType.APPOINTMENT_REJECTED, saved.getId());
        }

        return saved;
    }

    public Appointment holdAppointment(Long id, String holdMessage) {
        Appointment appointment = getAppointmentById(id);
        appointment.setStatus(AppointmentStatus.ON_HOLD);
        if (holdMessage != null && !holdMessage.trim().isEmpty()) {
            appointment.setDoctorMessage(holdMessage);
        }
        Appointment saved = appointmentRepository.save(appointment);

        // Notify patient
        if (saved.getPatientName() != null) {
            notificationService.sendNotification(
                    saved.getPatientName(), "PATIENT",
                    "Appointment On Hold",
                    "Your appointment with Dr. " + saved.getDoctorName() + " is on hold. " + (holdMessage != null ? holdMessage : "Please wait."),
                    NotificationType.APPOINTMENT_ON_HOLD, saved.getId());
        }

        return saved;
    }

    public Appointment cancelAppointment(Long id) {
        Appointment appointment = getAppointmentById(id);
        appointment.setStatus(AppointmentStatus.CANCELLED);
        return appointmentRepository.save(appointment);
    }

    public Appointment completeAppointment(Long id) {
        Appointment appointment = getAppointmentById(id);
        appointment.setStatus(AppointmentStatus.COMPLETED);
        Appointment saved = appointmentRepository.save(appointment);

        // Notify patient
        if (saved.getPatientName() != null) {
            notificationService.sendNotification(
                    saved.getPatientName(), "PATIENT",
                    "Appointment Completed",
                    "Your appointment with Dr. " + saved.getDoctorName() + " has been marked as completed.",
                    NotificationType.APPOINTMENT_COMPLETED, saved.getId());
        }

        return saved;
    }

    public Appointment updateAppointment(Long id, Appointment appointment) {
        Appointment existing = appointmentRepository.findById(id)
                .orElseThrow(() -> new AppointmentNotFoundException(id));
        if (appointment.getAppointmentDate() != null) existing.setAppointmentDate(appointment.getAppointmentDate());
        if (appointment.getAppointmentTime() != null) existing.setAppointmentTime(appointment.getAppointmentTime());
        if (appointment.getStatus() != null) existing.setStatus(appointment.getStatus());
        if (appointment.getReason() != null) existing.setReason(appointment.getReason());
        return appointmentRepository.save(existing);
    }

    public void deleteAppointment(Long id) {
        if (!appointmentRepository.existsById(id)) {
            throw new AppointmentNotFoundException(id);
        }
        appointmentRepository.deleteById(id);
    }

    public Appointment updateStatus(Long id, AppointmentStatus status) {
        Appointment appointment = getAppointmentById(id);
        appointment.setStatus(status);
        return appointmentRepository.save(appointment);
    }

    @Transactional
    public void deleteAppointmentsByPatientId(Long patientId) {
        appointmentRepository.deleteByPatientId(patientId);
    }

    @Transactional
    public void deleteAppointmentsByPatientPhone(String patientPhone) {
        appointmentRepository.deleteByPatientPhone(patientPhone);
    }

    @Transactional
    public void deleteAppointmentsByDoctorUsername(String doctorUsername) {
        appointmentRepository.deleteByDoctorUsername(doctorUsername);
    }

    /**
     * Get all pending appointments (for receptionist to review)
     */
    public List<Appointment> getAllPendingAppointments() {
        return appointmentRepository.findByStatusOrderByCreatedAtAsc(AppointmentStatus.PENDING);
    }

    /**
     * Get all pending + on-hold appointments (for receptionist to review)
     * ON_HOLD appointments stay visible until explicitly approved or rejected.
     */
    public List<Appointment> getPendingAndOnHoldAppointments() {
        return appointmentRepository.findByStatusInOrderByStatusAscCreatedAtAsc(
                List.of(AppointmentStatus.PENDING, AppointmentStatus.ON_HOLD));
    }

    /**
     * Get approved appointments for a doctor on a given date, sorted by queue
     */
    public List<Appointment> getApprovedForDoctorToday(String doctorUsername, LocalDate date) {
        return appointmentRepository.findByDoctorUsernameAndAppointmentDateAndStatusOrderByQueueNumberAsc(
                doctorUsername, date, AppointmentStatus.APPROVED);
    }
}

