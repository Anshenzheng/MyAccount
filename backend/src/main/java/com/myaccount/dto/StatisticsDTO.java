package com.myaccount.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
public class StatisticsDTO {
    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private BigDecimal balance;
    private List<CategoryStatistics> categoryStatistics;
    private List<DailyStatistics> dailyStatistics;
    
    @Data
    public static class CategoryStatistics {
        private String category;
        private String type;
        private BigDecimal amount;
        private BigDecimal percentage;
    }
    
    @Data
    public static class DailyStatistics {
        private String date;
        private BigDecimal income;
        private BigDecimal expense;
    }
}
