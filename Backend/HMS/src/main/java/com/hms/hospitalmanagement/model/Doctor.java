package com.hms.hospitalmanagement.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "doctors")
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "doctor_id")
    private Long id;

    @Column(name = "name", nullable = false, length = 100)
    @NotBlank(message = "Doctor name is required")
    private String name;

    @Column(name = "specialization", nullable = false, length = 100)
    @NotBlank(message = "Specialization is required")
    private String specialization;

    @Column(name = "phone", nullable = false, length = 10)
    @NotBlank(message = "Phone number is required")
    @Size(min = 10, max = 10, message = "Phone number must be 10 digits")
    private String phone;

    @Column(name = "experience", nullable = false)
    @Min(value = 0, message = "Experience cannot be negative")
    private Integer experience;
}
