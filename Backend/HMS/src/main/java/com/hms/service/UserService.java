package com.hms.service;

import java.util.List;
import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.hms.entity.Role;
import com.hms.entity.User;
import com.hms.hospitalmanagement.model.Doctor;
import com.hms.hospitalmanagement.repository.DoctorRepository;
import com.hms.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final DoctorRepository doctorRepository;

    public User registerUser(String username, String email, String password, Role role, String fullName, String specialization) {
        return registerUser(username, email, password, role, fullName, specialization, null, null, null, null);
    }

    public User registerUser(String username, String email, String password, Role role, String fullName, String specialization, String phone, Integer experience) {
        return registerUser(username, email, password, role, fullName, specialization, phone, experience, null, null);
    }

    public User registerUser(String username, String email, String password, Role role, String fullName, String specialization, String phone, Integer experience, String designation) {
        return registerUser(username, email, password, role, fullName, specialization, phone, experience, designation, null);
    }

    public User registerUser(String username, String email, String password, Role role, String fullName, String specialization, String phone, Integer experience, String designation, String gender) {
        // Prevent Admin and Receptionist role registration through public API
        if (role != null && (role == Role.ADMIN || role == Role.RECEPTIONIST)) {
            throw new IllegalArgumentException(role.name() + " registration is not allowed through this endpoint");
        }

        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);
        user.setFullName(fullName);
        user.setSpecialization(specialization);
        user.setDesignation(designation);
        user.setGender(gender);
        user.setEnabled(true);

        User savedUser = userRepository.save(user);

        // Also create a Doctor record in the doctors table when role is DOCTOR
        if (role == Role.DOCTOR) {
            Doctor doctor = new Doctor();
            doctor.setName(fullName != null ? fullName : username);
            doctor.setSpecialization(specialization != null ? specialization : "General Medicine");
            doctor.setPhone(phone != null ? phone : "0000000000");
            doctor.setExperience(experience != null ? experience : 0);
            doctorRepository.save(doctor);
        }

        return savedUser;
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public boolean validatePassword(String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }

    public List<User> getDoctorsList() {
        return userRepository.findByRoleAndEnabledTrue(Role.DOCTOR);
    }

    public List<User> getAllDoctors() {
        return userRepository.findByRole(Role.DOCTOR);
    }

    public User saveUser(User user) {
        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    public void updatePassword(User user, String newRawPassword) {
        user.setPassword(passwordEncoder.encode(newRawPassword));
        userRepository.save(user);
    }
}
