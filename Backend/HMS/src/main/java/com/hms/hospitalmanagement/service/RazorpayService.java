package com.hms.hospitalmanagement.service;

import java.math.BigDecimal;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Refund;

import lombok.extern.slf4j.Slf4j;

/**
 * Service for Razorpay Payment Gateway integration.
 * Handles order creation, payment verification, and refunds.
 */
@Service
@Slf4j
public class RazorpayService {

    private final String keyId;
    private final String keySecret;
    private final RazorpayClient razorpayClient;

    public RazorpayService(
            @Value("${razorpay.key.id}") String keyId,
            @Value("${razorpay.key.secret}") String keySecret) throws RazorpayException {
        this.keyId = keyId;
        this.keySecret = keySecret;
        this.razorpayClient = new RazorpayClient(keyId, keySecret);
        log.info("Razorpay client initialized with key: {}", keyId);
    }

    /**
     * Get the Razorpay Key ID (public key for frontend checkout).
     */
    public String getKeyId() {
        return keyId;
    }

    /**
     * Create a Razorpay order.
     *
     * @param amount   Amount in INR (will be converted to paise)
     * @param currency Currency code (default INR)
     * @param receipt  Unique receipt identifier
     * @param notes    Additional notes (patient name, doctor, etc.)
     * @return Razorpay Order object
     */
    public Order createOrder(BigDecimal amount, String currency, String receipt, JSONObject notes)
            throws RazorpayException {
        JSONObject orderRequest = new JSONObject();
        // Razorpay expects amount in paise (smallest currency unit)
        orderRequest.put("amount", amount.multiply(BigDecimal.valueOf(100)).intValue());
        orderRequest.put("currency", currency != null ? currency : "INR");
        orderRequest.put("receipt", receipt);
        if (notes != null) {
            orderRequest.put("notes", notes);
        }
        orderRequest.put("payment_capture", 1); // Auto-capture payment

        // Retry up to 3 times for transient network/DNS failures
        int maxRetries = 3;
        RazorpayException lastException = null;
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                Order order = razorpayClient.orders.create(orderRequest);
                log.info("Razorpay order created: {} for amount ₹{} (attempt {})", order.get("id"), amount, attempt);
                return order;
            } catch (RazorpayException e) {
                lastException = e;
                log.warn("Razorpay order creation attempt {}/{} failed: {}", attempt, maxRetries, e.getMessage());
                if (attempt < maxRetries) {
                    try {
                        Thread.sleep(1000 * attempt); // Backoff: 1s, 2s
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw e;
                    }
                }
            }
        }
        throw lastException;
    }

    /**
     * Verify Razorpay payment signature.
     * Uses HMAC-SHA256 to verify that the payment response is authentic.
     *
     * @param razorpayOrderId   The Razorpay order ID
     * @param razorpayPaymentId The Razorpay payment ID
     * @param razorpaySignature The signature from Razorpay checkout
     * @return true if signature is valid
     */
    public boolean verifyPaymentSignature(String razorpayOrderId, String razorpayPaymentId,
            String razorpaySignature) {
        try {
            String data = razorpayOrderId + "|" + razorpayPaymentId;
            String generatedSignature = hmacSha256(data, keySecret);
            boolean valid = generatedSignature.equals(razorpaySignature);
            if (!valid) {
                log.warn("Razorpay signature verification failed for order: {}", razorpayOrderId);
            }
            return valid;
        } catch (Exception e) {
            log.error("Error verifying Razorpay signature: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Process a refund via Razorpay API.
     *
     * @param razorpayPaymentId The Razorpay payment ID to refund
     * @param amount            Refund amount in INR (null for full refund)
     * @return Razorpay Refund object
     */
    public Refund processRefund(String razorpayPaymentId, BigDecimal amount)
            throws RazorpayException {
        JSONObject refundRequest = new JSONObject();
        if (amount != null) {
            refundRequest.put("amount", amount.multiply(BigDecimal.valueOf(100)).intValue());
        }
        refundRequest.put("speed", "normal");

        Refund refund = razorpayClient.payments.refund(razorpayPaymentId, refundRequest);
        log.info("Razorpay refund processed: {} for payment: {}", refund.get("id"), razorpayPaymentId);
        return refund;
    }

    /**
     * Generate HMAC-SHA256 signature.
     */
    private String hmacSha256(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes("UTF-8"), "HmacSHA256");
        mac.init(secretKeySpec);
        byte[] hash = mac.doFinal(data.getBytes("UTF-8"));
        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
