package com.hms.hospitalmanagement.repository;

import com.hms.hospitalmanagement.model.PatientRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PatientRecordRepository extends JpaRepository<PatientRecord, Long> {
    List<PatientRecord> findByDoctorUsername(String doctorUsername);
    List<PatientRecord> findByPatientName(String patientName);
    void deleteByPatientName(String patientName);
    void deleteByDoctorUsername(String doctorUsername);
}
