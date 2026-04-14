package com.hms.hospitalmanagement.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "patients")
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "patient_id")
    private Long id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "age", nullable = false)
    private Integer age;

    @Column(name = "gender", length = 10)
    private String gender;

    @Column(name = "phone", length = 15)
    private String phone;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "blood_group", length = 10)
    private String bloodGroup;

    @Column(name = "email", length = 100, unique = true)
    private String email;

    @Column(name = "date_of_birth", length = 10)
    private String dateOfBirth;

    @Column(name = "patient_login_id", length = 50, unique = true)
    private String patientLoginId;

    @Column(name = "patient_password", length = 255)
    private String patientPassword;

    @Column(name = "plaintext_password", length = 100)
    private String plaintextPassword;

    @Transient
    private String generatedPlaintextPassword;
}
