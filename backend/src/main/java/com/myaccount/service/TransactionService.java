package com.myaccount.service;

import com.myaccount.dto.StatisticsDTO;
import com.myaccount.dto.TransactionDTO;
import com.myaccount.entity.Transaction;
import com.myaccount.repository.TransactionRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class TransactionService {
    
    @Autowired
    private TransactionRepository transactionRepository;
    
    private static final List<String> DEFAULT_INCOME_CATEGORIES = Arrays.asList(
            "工资", "奖金", "投资收益", "兼职收入", "其他收入"
    );
    
    private static final List<String> DEFAULT_EXPENSE_CATEGORIES = Arrays.asList(
            "餐饮", "交通", "购物", "娱乐", "医疗", "教育", "住房", "其他支出"
    );
    
    private static final List<String> DEFAULT_ACCOUNTS = Arrays.asList(
            "支付宝", "微信", "银行卡", "现金", "信用卡"
    );
    
    @Transactional
    public Transaction createTransaction(TransactionDTO dto) {
        Transaction transaction = new Transaction();
        BeanUtils.copyProperties(dto, transaction);
        if (transaction.getTransactionTime() == null) {
            transaction.setTransactionTime(LocalDateTime.now());
        }
        return transactionRepository.save(transaction);
    }
    
    @Transactional
    public Transaction updateTransaction(Long id, TransactionDTO dto) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("交易记录不存在"));
        BeanUtils.copyProperties(dto, transaction, "id", "createdAt");
        return transactionRepository.save(transaction);
    }
    
    @Transactional
    public void deleteTransaction(Long id) {
        transactionRepository.deleteById(id);
    }
    
    public Transaction getTransaction(Long id) {
        return transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("交易记录不存在"));
    }
    
    public Page<Transaction> getTransactions(LocalDateTime startTime, LocalDateTime endTime, 
                                              String type, String tags, Pageable pageable) {
        if (startTime == null) {
            startTime = LocalDateTime.of(2000, 1, 1, 0, 0);
        }
        if (endTime == null) {
            endTime = LocalDateTime.now();
        }
        String filteredType = (type == null || type.trim().isEmpty()) ? null : type;
        String filteredTags = (tags == null || tags.trim().isEmpty()) ? null : tags;
        return transactionRepository.findByFilters(startTime, endTime, filteredType, filteredTags, pageable);
    }
    
    public StatisticsDTO getStatistics(LocalDateTime startTime, LocalDateTime endTime) {
        if (startTime == null) {
            startTime = LocalDateTime.of(2000, 1, 1, 0, 0);
        }
        if (endTime == null) {
            endTime = LocalDateTime.now();
        }
        
        StatisticsDTO statistics = new StatisticsDTO();
        
        BigDecimal totalIncome = transactionRepository.sumIncomeByTimeRange(startTime, endTime);
        BigDecimal totalExpense = transactionRepository.sumExpenseByTimeRange(startTime, endTime);
        
        statistics.setTotalIncome(totalIncome);
        statistics.setTotalExpense(totalExpense);
        statistics.setBalance(totalIncome.subtract(totalExpense));
        
        List<Object[]> categoryResults = transactionRepository.sumByCategoryAndType(startTime, endTime);
        List<StatisticsDTO.CategoryStatistics> categoryStatistics = new ArrayList<>();
        
        BigDecimal totalIncomeForPercent = totalIncome.compareTo(BigDecimal.ZERO) == 0 ? BigDecimal.ONE : totalIncome;
        BigDecimal totalExpenseForPercent = totalExpense.compareTo(BigDecimal.ZERO) == 0 ? BigDecimal.ONE : totalExpense;
        
        for (Object[] result : categoryResults) {
            StatisticsDTO.CategoryStatistics cs = new StatisticsDTO.CategoryStatistics();
            cs.setCategory((String) result[0]);
            cs.setType((String) result[1]);
            cs.setAmount((BigDecimal) result[2]);
            
            BigDecimal total = "income".equals(cs.getType()) ? totalIncomeForPercent : totalExpenseForPercent;
            cs.setPercentage(cs.getAmount().multiply(new BigDecimal("100")).divide(total, 2, RoundingMode.HALF_UP));
            
            categoryStatistics.add(cs);
        }
        statistics.setCategoryStatistics(categoryStatistics);
        
        List<Object[]> dailyResults = transactionRepository.sumByDateAndType(startTime, endTime);
        Map<String, StatisticsDTO.DailyStatistics> dailyMap = new LinkedHashMap<>();
        
        for (Object[] result : dailyResults) {
            java.sql.Date date = (java.sql.Date) result[0];
            String dateStr = date.toLocalDate().format(DateTimeFormatter.ISO_LOCAL_DATE);
            String type = (String) result[1];
            BigDecimal amount = (BigDecimal) result[2];
            
            StatisticsDTO.DailyStatistics ds = dailyMap.computeIfAbsent(dateStr, k -> {
                StatisticsDTO.DailyStatistics newDs = new StatisticsDTO.DailyStatistics();
                newDs.setDate(k);
                newDs.setIncome(BigDecimal.ZERO);
                newDs.setExpense(BigDecimal.ZERO);
                return newDs;
            });
            
            if ("income".equals(type)) {
                ds.setIncome(ds.getIncome().add(amount));
            } else {
                ds.setExpense(ds.getExpense().add(amount));
            }
        }
        
        statistics.setDailyStatistics(new ArrayList<>(dailyMap.values()));
        
        return statistics;
    }
    
    public List<String> getAllTags() {
        return transactionRepository.findAllDistinctTags();
    }
    
    public List<String> getCategories(String type) {
        List<String> categories = transactionRepository.findDistinctCategoriesByType(type);
        if (categories.isEmpty()) {
            return "income".equals(type) ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;
        }
        return categories;
    }
    
    public List<String> getDefaultCategories(String type) {
        return "income".equals(type) ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;
    }
    
    public List<String> getAccounts() {
        return DEFAULT_ACCOUNTS;
    }
}
