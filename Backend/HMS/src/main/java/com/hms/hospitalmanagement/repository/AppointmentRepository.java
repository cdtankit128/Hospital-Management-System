package com.hms.hospitalmanagement.repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.hms.hospitalmanagement.model.Appointment;
import com.hms.hospitalmanagement.model.AppointmentStatus;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByPatientId(Long patientId);
    List<Appointment> findByDoctorId(Long doctorId);
    List<Appointment> findByStatus(AppointmentStatus status);
    List<Appointment> findByAppointmentDate(LocalDate date);
    List<Appointment> findByDoctorIdAndStatus(Long doctorId, AppointmentStatus status);
    List<Appointment> findByPatientIdAndStatus(Long patientId, AppointmentStatus status);

    // New queries for username-based lookups
    List<Appointment> findByDoctorUsernameOrderByAppointmentDateDescAppointmentTimeDesc(String doctorUsername);
    List<Appointment> findByDoctorUsernameAndStatusOrderByAppointmentDateAscAppointmentTimeAsc(String doctorUsername, AppointmentStatus status);
    List<Appointment> findByPatientPhoneOrderByAppointmentDateDescAppointmentTimeDesc(String patientPhone);
    List<Appointment> findByPatientNameOrderByAppointmentDateDescAppointmentTimeDesc(String patientName);

    // Case-insensitive name search
    @Query("SELECT a FROM Appointment a WHERE LOWER(a.patientName) = LOWER(:name) ORDER BY a.appointmentDate DESC, a.appointmentTime DESC")
    List<Appointment> findByPatientNameIgnoreCaseOrderByDateDesc(@Param("name") String name);

    // Slot availability check
    List<Appointment> findByDoctorUsernameAndAppointmentDateAndStatusNot(String doctorUsername, LocalDate date, AppointmentStatus status);
    boolean existsByDoctorUsernameAndAppointmentDateAndAppointmentTimeAndStatusNot(
            String doctorUsername, LocalDate date, LocalTime time, AppointmentStatus status);

    // Cascade delete support
    void deleteByPatientId(Long patientId);
    void deleteByPatientPhone(String patientPhone);
    void deleteByDoctorUsername(String doctorUsername);

    // Appointment number generation: find max appointment number
    @Query("SELECT COALESCE(MAX(a.appointmentNumber), 0) FROM Appointment a")
    Long findMaxAppointmentNumber();

    // Queue number per doctor per date: count approved/pending appointments
    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.doctorUsername = :doctorUsername AND a.appointmentDate = :date AND a.status IN ('APPROVED', 'PENDING', 'BOOKED')")
    int countQueueForDoctorOnDate(@Param("doctorUsername") String doctorUsername, @Param("date") LocalDate date);

    // Find all pending (patient-booked) appointments for receptionist review
    List<Appointment> findByStatusOrderByCreatedAtAsc(AppointmentStatus status);

    // Find appointments by multiple statuses (PENDING + ON_HOLD) for receptionist review
    List<Appointment> findByStatusInOrderByStatusAscCreatedAtAsc(List<AppointmentStatus> statuses);

    // Doctor's approved appointments for today
    List<Appointment> findByDoctorUsernameAndAppointmentDateAndStatusOrderByQueueNumberAsc(
            String doctorUsername, LocalDate date, AppointmentStatus status);
}

