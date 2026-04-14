package com.hms.entity;

public enum Role {
    ADMIN("ROLE_ADMIN"),
    DOCTOR("ROLE_DOCTOR"),
    PATIENT("ROLE_PATIENT"),
    RECEPTIONIST("ROLE_RECEPTIONIST");

    private final String value;

    Role(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
