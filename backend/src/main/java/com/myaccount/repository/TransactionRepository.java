package com.myaccount.repository;

import com.myaccount.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    
    Page<Transaction> findByTransactionTimeBetweenOrderByTransactionTimeDesc(
            LocalDateTime startTime, LocalDateTime endTime, Pageable pageable);
    
    Page<Transaction> findByTypeAndTransactionTimeBetweenOrderByTransactionTimeDesc(
            String type, LocalDateTime startTime, LocalDateTime endTime, Pageable pageable);
    
    @Query(value = "SELECT * FROM transaction t WHERE t.transaction_time BETWEEN :startTime AND :endTime " +
           "AND (:type IS NULL OR t.type = :type) " +
           "AND (:tags IS NULL OR EXISTS (" +
           "  SELECT 1 FROM (" +
           "    SELECT TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(:tags, ',', n), ',', -1)) AS tag " +
           "    FROM (SELECT 1 AS n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 " +
           "          UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10) nums " +
           "    WHERE n <= LENGTH(:tags) - LENGTH(REPLACE(:tags, ',', '')) + 1" +
           "  ) split_tags " +
           "  WHERE FIND_IN_SET(split_tags.tag, REPLACE(t.tags, ' ', '')) > 0" +
           ")) " +
           "ORDER BY t.transaction_time DESC", nativeQuery = true)
    Page<Transaction> findByFilters(
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("type") String type,
            @Param("tags") String tags,
            Pageable pageable);
    
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.type = 'income' AND t.transactionTime BETWEEN :startTime AND :endTime")
    BigDecimal sumIncomeByTimeRange(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);
    
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.type = 'expense' AND t.transactionTime BETWEEN :startTime AND :endTime")
    BigDecimal sumExpenseByTimeRange(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);
    
    @Query("SELECT t.category, t.type, SUM(t.amount) FROM Transaction t WHERE t.transactionTime BETWEEN :startTime AND :endTime GROUP BY t.category, t.type")
    List<Object[]> sumByCategoryAndType(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);
    
    @Query("SELECT FUNCTION('DATE', t.transactionTime), t.type, SUM(t.amount) FROM Transaction t WHERE t.transactionTime BETWEEN :startTime AND :endTime GROUP BY FUNCTION('DATE', t.transactionTime), t.type ORDER BY FUNCTION('DATE', t.transactionTime)")
    List<Object[]> sumByDateAndType(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);
    
    @Query("SELECT DISTINCT t.tags FROM Transaction t WHERE t.tags IS NOT NULL AND t.tags <> ''")
    List<String> findAllDistinctTags();
    
    @Query("SELECT DISTINCT t.category FROM Transaction t WHERE t.type = :type")
    List<String> findDistinctCategoriesByType(@Param("type") String type);
}
