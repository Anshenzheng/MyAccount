package com.myaccount.controller;

import com.myaccount.dto.StatisticsDTO;
import com.myaccount.dto.TransactionDTO;
import com.myaccount.entity.Transaction;
import com.myaccount.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "http://localhost:4200")
public class TransactionController {
    
    @Autowired
    private TransactionService transactionService;
    
    @PostMapping
    public ResponseEntity<Transaction> createTransaction(@Valid @RequestBody TransactionDTO dto) {
        Transaction transaction = transactionService.createTransaction(dto);
        return ResponseEntity.ok(transaction);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Transaction> updateTransaction(@PathVariable Long id, 
                                                          @Valid @RequestBody TransactionDTO dto) {
        Transaction transaction = transactionService.updateTransaction(id, dto);
        return ResponseEntity.ok(transaction);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable Long id) {
        transactionService.deleteTransaction(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Transaction> getTransaction(@PathVariable Long id) {
        Transaction transaction = transactionService.getTransaction(id);
        return ResponseEntity.ok(transaction);
    }
    
    @GetMapping
    public ResponseEntity<Page<Transaction>> getTransactions(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String tags,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<Transaction> transactions = transactionService.getTransactions(
                startTime, endTime, type, tags, pageable);
        return ResponseEntity.ok(transactions);
    }
    
    @GetMapping("/statistics")
    public ResponseEntity<StatisticsDTO> getStatistics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        
        StatisticsDTO statistics = transactionService.getStatistics(startTime, endTime);
        return ResponseEntity.ok(statistics);
    }
    
    @GetMapping("/tags")
    public ResponseEntity<List<String>> getAllTags() {
        List<String> tags = transactionService.getAllTags();
        return ResponseEntity.ok(tags);
    }
    
    @GetMapping("/categories")
    public ResponseEntity<List<String>> getCategories(@RequestParam String type) {
        List<String> categories = transactionService.getCategories(type);
        return ResponseEntity.ok(categories);
    }
    
    @GetMapping("/default-categories")
    public ResponseEntity<List<String>> getDefaultCategories(@RequestParam String type) {
        List<String> categories = transactionService.getDefaultCategories(type);
        return ResponseEntity.ok(categories);
    }
    
    @GetMapping("/accounts")
    public ResponseEntity<List<String>> getAccounts() {
        List<String> accounts = transactionService.getAccounts();
        return ResponseEntity.ok(accounts);
    }
}
