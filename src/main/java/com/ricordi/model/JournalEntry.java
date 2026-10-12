package com.ricordi.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "journal_entries")
public class JournalEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "user_id", nullable = true)
    private User user;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private LocalDate memoryDate;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected JournalEntry() {
    }

    public JournalEntry(User user, String title, String content, LocalDate memoryDate) {
        this.user = user;
        this.title = (title != null && !title.trim().isEmpty()) ? title : "Journal Entry for " + memoryDate;
        this.content = (content != null) ? content : "";
        this.memoryDate = memoryDate;
        this.createdAt = LocalDateTime.now();
    }

    @jakarta.persistence.PrePersist
    void initializeCreatedAt() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDate getMemoryDate() {
        return memoryDate;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
