package com.hms.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.hms.entity.Role;
import com.hms.entity.User;
import com.hms.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Override
    public void run(String... args) throws Exception {
        // Create ADMIN user
        if (!userRepository.existsByUsername("admin")) {
            User adminUser = new User();
            adminUser.setUsername("admin");
            adminUser.setEmail("admin@hms.com");
            adminUser.setPassword(passwordEncoder.encode("admin"));
            adminUser.setRole(Role.ADMIN);
            adminUser.setEnabled(true);
            
            userRepository.save(adminUser);
            System.out.println("✓ Admin user created: admin / admin");
        }
        
        // Doctor user creation removed
        
        // Create PATIENT user
        if (!userRepository.existsByUsername("patient")) {
            User patientUser = new User();
            patientUser.setUsername("patient");
            patientUser.setEmail("patient@hms.com");
            patientUser.setPassword(passwordEncoder.encode("patient"));
            patientUser.setRole(Role.PATIENT);
            patientUser.setEnabled(true);
            
            userRepository.save(patientUser);
            System.out.println("✓ Patient user created: patient / patient");
        }

        // Create RECEPTIONIST user
        if (!userRepository.existsByUsername("reception")) {
            User receptionUser = new User();
            receptionUser.setUsername("reception");
            receptionUser.setEmail("reception@hms.com");
            receptionUser.setPassword(passwordEncoder.encode("reception"));
            receptionUser.setRole(Role.RECEPTIONIST);
            receptionUser.setFullName("Front Desk");
            receptionUser.setEnabled(true);
            
            userRepository.save(receptionUser);
            System.out.println("✓ Receptionist user created: reception / reception");
        }
    }
}
