package com.hms.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hms.dto.ChatRequest;
import com.hms.dto.ChatResponse;
import com.hms.service.GeminiService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final GeminiService geminiService;

    @PostMapping
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
        String role = request.getRole() != null ? request.getRole() : "doctor";
        String reply = geminiService.chat(request.getMessage(), role);
        return ResponseEntity.ok(new ChatResponse(reply));
    }
}
