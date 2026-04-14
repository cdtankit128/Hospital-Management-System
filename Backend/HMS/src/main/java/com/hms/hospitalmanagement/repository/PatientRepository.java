package com.hms.hospitalmanagement.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.hms.hospitalmanagement.model.Patient;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<Patient> findByPatientLoginId(String patientLoginId);
    boolean existsByPatientLoginId(String patientLoginId);
    Optional<Patient> findByPhone(String phone);
}
