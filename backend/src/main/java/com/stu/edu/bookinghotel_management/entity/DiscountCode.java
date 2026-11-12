package com.stu.edu.bookinghotel_management.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "discount_codes")
@Getter
@Setter
@NoArgsConstructor
public class DiscountCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(
            name = "code",
            nullable = false,
            unique = true,
            length = 50
    )
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "discount_type",
            nullable = false,
            length = 20
    )
    private DiscountType discountType;

    // PERCENT: 10 nghĩa là giảm 10%.
    // FIXED: 100000 nghĩa là giảm 100.000đ.
    @Column(
            name = "discount_value",
            nullable = false,
            precision = 15,
            scale = 2
    )
    private BigDecimal discountValue;

    @Column(name = "expires_at", nullable = false)
    private LocalDate expiresAt;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();

        if (code != null) {
            code = code.trim().toUpperCase();
        }
    }
}