package com.hms.hospitalmanagement.exception;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.hms.dto.LoginResponse;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(PatientNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handlePatientNotFound(PatientNotFoundException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", HttpStatus.NOT_FOUND.value());
        response.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(DoctorNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleDoctorNotFound(DoctorNotFoundException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", HttpStatus.NOT_FOUND.value());
        response.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(AppointmentNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleAppointmentNotFound(AppointmentNotFoundException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", HttpStatus.NOT_FOUND.value());
        response.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<?> handleHttpMessageNotReadable(HttpMessageNotReadableException e) {
        return ResponseEntity
                .badRequest()
                .body(new LoginResponse(
                        "Invalid request body: JSON is required and must not be empty",
                        null, null, null, null, null, null, null, null
                ));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidationExceptions(MethodArgumentNotValidException e) {
        BindingResult bindingResult = e.getBindingResult();
        String message = bindingResult.getFieldErrors()
                .stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .findFirst()
                .orElse("Validation failed");

        return ResponseEntity
                .badRequest()
                .body(new LoginResponse(message, null, null, null, null, null, null, null, null));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleRuntimeException(RuntimeException e) {
        // Log the exception securely
        e.printStackTrace();
        
        // Let Spring Security handle access denied exceptions appropriately instead of 500s
        if (e.getClass().getName().contains("AccessDeniedException")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied");
        }
        
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new LoginResponse("Internal Server Error: " + e.getMessage(), null, null, null, null, null, null, null, null));
    }
}
