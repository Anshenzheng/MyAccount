package com.myaccount.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "transactions")
public class Transaction {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;
    
    @Column(nullable = false, length = 20)
    private String type;
    
    @Column(nullable = false, length = 50)
    private String category;
    
    @Column(nullable = false)
    private LocalDateTime transactionTime;
    
    @Column(length = 100)
    private String tags;
    
    @Column(length = 500)
    private String remark;
    
    @Column(length = 50)
    private String account;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (transactionTime == null) {
            transactionTime = LocalDateTime.now();
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
