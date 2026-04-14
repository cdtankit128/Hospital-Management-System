package com.hms.dto;

import lombok.Data;

@Data
public class ChatRequest {
    private String message;
    private String role; // "doctor" or "patient"
}
