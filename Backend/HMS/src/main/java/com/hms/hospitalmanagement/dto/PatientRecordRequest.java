package com.hms.hospitalmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PatientRecordRequest {
    private String patientName;
    private String diagnosis;
    private String prescription;
}
