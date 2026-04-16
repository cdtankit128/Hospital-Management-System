package com.hms.security;

import java.util.Arrays;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import lombok.RequiredArgsConstructor;

/**
 * Spring Security Configuration for JWT-based authentication.
 * 
 * This configuration:
 * - Disables CSRF (stateless JWT authentication)
 * - Enables CORS for React frontend (localhost:3000, 3001)
 * - Configures stateless session management
 * - Integrates JWT authentication filter
 * - Permits public access to /api/auth/** endpoints
 * - Requires authentication for all other endpoints
 * - Uses BCrypt for password encoding
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {
    
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * BCrypt Password Encoder bean.
     * Strength: 10 (default, provides good balance between security and performance)
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }

    /**
     * Main Security Filter Chain configuration.
     * 
     * - CSRF: Disabled (JWT doesn't require CSRF protection)
     * - Session: Stateless (JWT tokens instead of sessions)
     * - CORS: Enabled for React frontend origins
     * - Auth: JWT filter before UsernamePasswordAuthenticationFilter
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // Disable CSRF for stateless JWT authentication
                .csrf(csrf -> csrf.disable())

                // Disable default form login and http basic (we use JWT)
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                
                // Enable CORS with custom configuration
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                
                // Stateless session management (JWT doesn't use sessions)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                
                // Configure authorization rules
                .authorizeHttpRequests(authz -> authz
                        // Allow CORS preflight requests FIRST
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        
                        // Allow public access to authentication endpoints
                        .requestMatchers("/api/auth/**").permitAll()

                        // Allow public patient self-registration
                        .requestMatchers(HttpMethod.POST, "/api/patients").permitAll()

                        // Allow patient to fetch their own records
                        .requestMatchers(HttpMethod.GET, "/api/patients/records-by-name").permitAll()

                        // Allow public access to doctor listing (for chatbot)
                        .requestMatchers(HttpMethod.GET, "/api/auth/doctors-list").permitAll()

                        // Allow public appointment booking and slot checking
                        .requestMatchers(HttpMethod.POST, "/api/appointments/book").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/appointments/available-slots").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/appointments/patient-by-phone/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/appointments/patient-by-name/**").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/appointments/*/cancel").permitAll()

                        // Allow public payment endpoints (patient-initiated payments)
                        .requestMatchers(HttpMethod.POST, "/api/payments/create-order").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/payments/razorpay/create-order").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/payments/razorpay/verify").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/payments/razorpay/key").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/payments/*/confirm").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/payments/*/refund").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/payments/by-appointment/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/payments/by-phone/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/payments/by-name/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/payments/receipt/**").permitAll()

                        // Allow ChatGPT chatbot endpoint (public)
                        .requestMatchers("/api/chat/**").permitAll()

                        // Allow email test endpoint
                        .requestMatchers("/api/email/**").permitAll()

                        // Allow WebSocket endpoint (public — auth handled inside WS)
                        .requestMatchers("/ws/**").permitAll()

                        // Allow server-time endpoint (public)
                        .requestMatchers(HttpMethod.GET, "/api/notifications/server-time").permitAll()

                        // Allow patient notification endpoints (public — patients use name-based lookup)
                        .requestMatchers(HttpMethod.GET, "/api/notifications/by-name").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/notifications/unread-by-name").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/notifications/unread-count-by-name").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/notifications/read-all-by-name").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/notifications/*/read").permitAll()

                        // Notification endpoints (authenticated — any role)
                        .requestMatchers(HttpMethod.GET, "/api/notifications").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/notifications/unread").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/notifications/unread-count").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/notifications/read-all").authenticated()
                        .requestMatchers("/api/notifications/**").permitAll()

                        // Receptionist endpoints (authenticated)
                        .requestMatchers("/api/receptionist/**").hasRole("RECEPTIONIST")
                        
                        // Require authentication for all other endpoints
                        .anyRequest().authenticated()
                )
                
                // Add JWT authentication filter before UsernamePasswordAuthenticationFilter
                .addFilterBefore(
                        new JwtAuthenticationFilter(jwtTokenProvider),
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    /**
     * CORS Configuration for React frontend.
     * Allows requests from localhost and Cloudflare tunnel domains
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Allowed origins (React frontend + LAN + Ngrok + Vercel)
        configuration.setAllowedOriginPatterns(Arrays.asList(
                "http://localhost:*",
                "https://localhost:*",
                "http://192.168.*.*:*",
                "https://*.ngrok-free.app",
                "https://*.ngrok-free.dev",
                "https://*.ngrok.io",
                "https://*.vercel.app"
        ));
        
        // Allowed HTTP methods
        configuration.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"
        ));
        
        // Allowed headers (allow all for flexibility)
        configuration.setAllowedHeaders(Arrays.asList("*"));
        
        // Expose both headers so frontend can read them if needed
        configuration.setExposedHeaders(Arrays.asList("Authorization", "X-Auth-Token"));
        
        // Allow credentials (needed for cookies/auth headers)
        configuration.setAllowCredentials(true);
        
        // Max age for preflight cache
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
