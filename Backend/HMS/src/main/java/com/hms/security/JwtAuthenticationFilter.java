package com.hms.security;

import java.io.IOException;
import java.util.Collections;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtTokenProvider tokenProvider;

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            // Skip JWT validation for public endpoints
            String requestPath = request.getRequestURI();
            String method = request.getMethod();
            if (requestPath.startsWith("/api/auth/") || requestPath.equals("/error")
                    || requestPath.startsWith("/api/chat")
                    || requestPath.startsWith("/api/notifications/server-time")
                    || requestPath.startsWith("/api/notifications/by-name")
                    || requestPath.startsWith("/api/notifications/unread-by-name")
                    || requestPath.startsWith("/api/notifications/unread-count-by-name")
                    || requestPath.startsWith("/api/notifications/read-all-by-name")
                    || requestPath.startsWith("/ws")
                    || (method.equals("POST") && requestPath.equals("/api/appointments/book"))
                    || requestPath.startsWith("/api/appointments/patient-by-")
                    || requestPath.startsWith("/api/appointments/available-slots")
                    || (method.equals("PUT") && requestPath.matches("/api/appointments/\\d+/cancel"))
                    || (method.equals("PUT") && requestPath.matches("/api/notifications/\\d+/read"))
                    || (method.equals("POST") && requestPath.equals("/api/patients"))
                    || requestPath.equals("/api/patients/records-by-name")
                    || requestPath.startsWith("/api/payments/razorpay/")
                    || (method.equals("POST") && requestPath.equals("/api/payments/create-order"))
                    || requestPath.startsWith("/api/payments/by-")
                    || requestPath.startsWith("/api/payments/receipt/")
                    || (method.equals("PUT") && requestPath.matches("/api/payments/\\d+/confirm"))
                    || (method.equals("PUT") && requestPath.matches("/api/payments/\\d+/refund"))
                    || requestPath.startsWith("/api/email")) {
                filterChain.doFilter(request, response);
                return;
            }

            // Validate JWT token for protected endpoints
            String token = getTokenFromRequest(request);

            if (token != null && tokenProvider.validateToken(token)) {
                String username = tokenProvider.getUsernameFromToken(token);
                String role = tokenProvider.getRoleFromToken(token);

                // Normalize role: strip ROLE_ prefix if present so we always add it exactly once
                String baseRole = role.startsWith("ROLE_") ? role.substring(5) : role;
                String roleWithPrefix = "ROLE_" + baseRole;
                SimpleGrantedAuthority authority = new SimpleGrantedAuthority(roleWithPrefix);
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(username, null, Collections.singletonList(authority));

                SecurityContextHolder.getContext().setAuthentication(authentication);
            } else if (token != null) {
                // Token present but invalid/expired — return 401 so frontend can redirect to login
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"Token expired or invalid. Please log in again.\"}");
                return;
            }
        } catch (Exception e) {
            logger.error("Could not set user authentication in security context", e);
        }

        filterChain.doFilter(request, response);
    }

    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
