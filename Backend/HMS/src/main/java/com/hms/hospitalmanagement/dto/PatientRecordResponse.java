package com.hms.hospitalmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PatientRecordResponse {
    private Long id;
    private String patientName;
    private String diagnosis;
    private String prescription;
    private String message;
    private boolean success;
}
