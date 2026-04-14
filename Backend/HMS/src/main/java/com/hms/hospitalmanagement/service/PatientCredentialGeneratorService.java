package com.hms.hospitalmanagement.service;

import java.util.Random;

import org.springframework.stereotype.Service;

@Service
public class PatientCredentialGeneratorService {

    private static final String UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
    private static final String DIGITS = "0123456789";
    private static final String ALL_CHARS = UPPERCASE + LOWERCASE + DIGITS;
    private static final Random random = new Random();

    /**
     * Generate Patient Login ID from Patient Name and Phone Number
     * Format: lowercase_name + last 4 digits of phone + random 2 digits
     * 
     * Example:
     *   Name: Rahul
     *   Phone: 7903949594
     *   PatientID: rahul9594XX
     */
    public String generatePatientLoginId(String patientName, String phone) {
        if (patientName == null || patientName.trim().isEmpty()) {
            throw new IllegalArgumentException("Patient name is required");
        }

        // Convert name to lowercase and remove spaces
        String namePart = patientName.trim().toLowerCase().replaceAll("\\s+", "");

        // Use last 4 digits of phone if available, otherwise random 4 digits
        String suffix;
        if (phone != null && phone.replaceAll("[^0-9]", "").length() >= 4) {
            String digits = phone.replaceAll("[^0-9]", "");
            suffix = digits.substring(digits.length() - 4);
        } else {
            suffix = String.format("%04d", random.nextInt(10000));
        }

        // Add 2 random digits for uniqueness
        String randomPart = String.format("%02d", random.nextInt(100));

        String patientId = namePart + suffix + randomPart;

        // Ensure length doesn't exceed reasonable limits
        if (patientId.length() > 30) {
            patientId = patientId.substring(0, 30);
        }

        return patientId;
    }

    /**
     * Generate a secure random password
     * Contains: Uppercase, Lowercase, Numbers
     * Minimum length: 8 characters
     */
    public String generateSecurePassword() {
        return generateSecurePassword(8);
    }

    /**
     * Generate a secure random password with specified length
     */
    public String generateSecurePassword(int length) {
        if (length < 8) {
            length = 8;
        }

        StringBuilder password = new StringBuilder(length);

        // Ensure at least one character from each category
        password.append(UPPERCASE.charAt(random.nextInt(UPPERCASE.length())));
        password.append(LOWERCASE.charAt(random.nextInt(LOWERCASE.length())));
        password.append(DIGITS.charAt(random.nextInt(DIGITS.length())));

        // Fill the rest with random characters from all categories
        for (int i = 3; i < length; i++) {
            password.append(ALL_CHARS.charAt(random.nextInt(ALL_CHARS.length())));
        }

        // Shuffle the password
        String shuffledPassword = shuffleString(password.toString());

        return shuffledPassword;
    }

    /**
     * Shuffle a string to randomize character positions
     */
    private String shuffleString(String input) {
        char[] chars = input.toCharArray();
        for (int i = chars.length - 1; i > 0; i--) {
            int j = random.nextInt(i + 1);
            // Swap
            char temp = chars[i];
            chars[i] = chars[j];
            chars[j] = temp;
        }
        return new String(chars);
    }
}
