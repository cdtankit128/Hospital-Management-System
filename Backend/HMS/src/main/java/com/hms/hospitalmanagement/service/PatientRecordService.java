package com.hms.hospitalmanagement.service;

import com.hms.hospitalmanagement.model.PatientRecord;
import com.hms.hospitalmanagement.repository.PatientRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PatientRecordService {
    
    private final PatientRecordRepository patientRecordRepository;
    
    public PatientRecord savePatientRecord(PatientRecord patientRecord) {
        return patientRecordRepository.save(patientRecord);
    }
    
    public List<PatientRecord> getRecordsByDoctorUsername(String doctorUsername) {
        return patientRecordRepository.findByDoctorUsername(doctorUsername);
    }
    
    public List<PatientRecord> getRecordsByPatientName(String patientName) {
        return patientRecordRepository.findByPatientName(patientName);
    }
    
    public Optional<PatientRecord> getRecordById(Long id) {
        return patientRecordRepository.findById(id);
    }
    
    public PatientRecord updatePatientRecord(Long id, PatientRecord patientRecord) {
        return patientRecordRepository.findById(id)
            .map(existing -> {
                existing.setPatientName(patientRecord.getPatientName());
                existing.setDiagnosis(patientRecord.getDiagnosis());
                existing.setPrescription(patientRecord.getPrescription());
                return patientRecordRepository.save(existing);
            })
            .orElseThrow(() -> new RuntimeException("Patient record not found"));
    }
    
    public void deletePatientRecord(Long id) {
        patientRecordRepository.deleteById(id);
    }
}
