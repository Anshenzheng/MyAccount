package com.myaccount.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class TransactionDTO {
    
    private Long id;
    
    @NotNull(message = "金额不能为空")
    @DecimalMin(value = "0.01", message = "金额必须大于0")
    private BigDecimal amount;
    
    @NotBlank(message = "类型不能为空")
    private String type;
    
    @NotBlank(message = "分类不能为空")
    private String category;
    
    private LocalDateTime transactionTime;
    
    private String tags;
    
    private String remark;
    
    private String account;
}
