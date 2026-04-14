package com.hms.security;

import java.security.Key;
import java.util.Date;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtTokenProvider {
    
    private final Key jwtKey;
    
    @Value("${app.jwtExpirationMs:86400000}")
    private long jwtExpirationMs;

    public JwtTokenProvider(@Value("${app.jwtSecret:MyVerySecureSecretKeyThatIsAtLeast256BitsLongForHS512AlgorithmVerification}") String jwtSecret) {
        // Use a fixed key from properties file (consistent across app restarts)
        // If not provided, use the default key above
        this.jwtKey = Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    public String generateToken(String username, String role) {
        return Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(jwtKey, SignatureAlgorithm.HS512)
                .compact();
    }

    public String getUsernameFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(jwtKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
        
        return claims.getSubject();
    }

    public String getRoleFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(jwtKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
        
        return (String) claims.get("role");
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(jwtKey)
                    .build()
                    .parseClaimsJws(token);
            
            return true;
        } catch (Exception e) {
            // Only log at debug level to avoid spam from invalid/fake tokens
            // System.err.println("JWT validation failed: " + e.getMessage());
            return false;
        }
    }
}

