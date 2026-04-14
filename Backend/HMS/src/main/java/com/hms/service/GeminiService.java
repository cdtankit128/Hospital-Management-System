package com.hms.service;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String model;

    private final RestTemplate restTemplate = new RestTemplate();

    private static final String SYSTEM_PROMPT = """
            You are a medical AI assistant for doctors at Chandigarh University Hospital.
            You are speaking to a licensed medical professional (doctor) who is logged into their dashboard.

            You help doctors with:
            - Summarizing clinical guidelines (e.g., hypertension, diabetes, COPD)
            - Drug interactions, dosages, and contraindications
            - Differential diagnosis suggestions based on symptoms
            - Treatment protocols and care plans
            - Medical research summaries and evidence-based recommendations
            - Post-operative care checklists
            - Lab result interpretation guidance
            - Hospital operational queries

            Hospital Details:
            - Name: Chandigarh University Hospital
            - Location: NH-05, Ludhiana-Chandigarh State Highway, Gharuan, Punjab 140413
            - Phone: +91 9939339811
            - Email: chdhms@gmail.com

            Guidelines:
            - You are talking to a DOCTOR, not a patient. Provide detailed clinical information.
            - Be professional, thorough, and evidence-based.
            - Include specific data: dosages, ranges, classifications, staging when relevant.
            - Use medical terminology appropriate for a physician.
            - Structure responses clearly with headings or bullet points.
            - Always note when guidelines may vary by region or have recent updates.
            - Add a brief disclaimer that this is AI-assisted and clinical judgment should prevail.
            """;

    private static final String PATIENT_SYSTEM_PROMPT = """
            You are a friendly, empathetic health assistant for patients at Chandigarh University Hospital.
            You are speaking to a patient who is logged into their patient dashboard.

            You help patients with:
            - Understanding their symptoms in simple, non-technical language
            - General health and wellness tips
            - Explaining medical terms, diagnoses, and lab reports in plain language
            - Guidance on when to see a doctor or visit the emergency room
            - Diet, exercise, and lifestyle recommendations for common conditions
            - Understanding medications, their purpose, and common side effects
            - Pre-visit and post-visit care instructions
            - Mental health awareness and stress management tips
            - Answering frequently asked health questions

            Hospital Details:
            - Name: Chandigarh University Hospital
            - Location: NH-05, Ludhiana-Chandigarh State Highway, Gharuan, Punjab 140413
            - Phone: +91 9939339811
            - Email: chdhms@gmail.com
            - OPD Timings: Mon-Sat 9 AM - 5 PM, Sunday 10 AM - 2 PM
            - Emergency: 24/7

            Guidelines:
            - You are talking to a PATIENT, not a medical professional. Use simple, easy-to-understand language.
            - Be warm, empathetic, and reassuring.
            - Never diagnose conditions — always recommend consulting their doctor for specific medical advice.
            - Provide general health information only.
            - Structure responses clearly with bullet points or numbered steps.
            - When in doubt, advise the patient to book an appointment or call the hospital.
            - Add a brief disclaimer that this is AI-assisted and not a substitute for professional medical advice.
            """;

    public String chat(String userMessage) {
        return chatWithRetry(userMessage, SYSTEM_PROMPT, 2);
    }

    public String chat(String userMessage, String role) {
        String prompt = "patient".equalsIgnoreCase(role) ? PATIENT_SYSTEM_PROMPT : SYSTEM_PROMPT;
        return chatWithRetry(userMessage, prompt, 2);
    }

    private String chatWithRetry(String userMessage, String systemPrompt, int retriesLeft) {
        String apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + model
                + ":generateContent?key=" + geminiApiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Gemini v1beta supports system_instruction
        Map<String, Object> requestBody = Map.of(
                "system_instruction", Map.of(
                        "parts", List.of(Map.of("text", systemPrompt))),
                "contents", List.of(
                        Map.of("role", "user", "parts", List.of(Map.of("text", userMessage)))),
                "generationConfig", Map.of(
                        "temperature", 0.7,
                        "maxOutputTokens", 4096));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            System.out.println("[Gemini] Calling Gemini API with model: " + model);
            ResponseEntity<Map> response = restTemplate.postForEntity(apiUrl, entity, Map.class);
            Map body = response.getBody();

            if (body != null && body.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) body.get("candidates");
                if (!candidates.isEmpty()) {
                    Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                    if (content != null) {
                        List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                        if (parts != null && !parts.isEmpty()) {
                            return (String) parts.get(0).get("text");
                        }
                    }
                }
            }
            System.err.println("[Gemini] No candidates in response: " + body);
            return "I'm sorry, I couldn't process your request right now. Please try again.";
        } catch (HttpClientErrorException e) {
            System.err.println("[Gemini] HTTP " + e.getStatusCode() + " error: " + e.getResponseBodyAsString());
            if (e.getStatusCode().value() == 429 && retriesLeft > 0) {
                System.out.println("[Gemini] Rate limited. Retrying in 3 seconds... (" + retriesLeft + " retries left)");
                try { Thread.sleep(3000); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
                return chatWithRetry(userMessage, systemPrompt, retriesLeft - 1);
            }
            return "I'm having trouble connecting to my AI service. Please wait a moment and try again.";
        } catch (Exception e) {
            System.err.println("[Gemini] Error: " + e.getClass().getSimpleName() + " - " + e.getMessage());
            e.printStackTrace();
            return "I'm having trouble connecting to my AI service. Please try again in a moment or contact the hospital at +91 9939339811.";
        }
    }
}
