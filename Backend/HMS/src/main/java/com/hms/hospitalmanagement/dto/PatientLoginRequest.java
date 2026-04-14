package com.hms.hospitalmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PatientLoginRequest {
    private String patientLoginId;
    private String patientPassword;
}
