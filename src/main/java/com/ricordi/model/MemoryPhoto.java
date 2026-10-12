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
@Table(name = "memory_photos")
public class MemoryPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate memoryDate;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "journal_entry_id", nullable = true)
    private JournalEntry journalEntry;

    @Column(nullable = false, length = 500)
    private String storagePath;

    @Column(length = 255)
    private String originalFileName;

    @Column(length = 300)
    private String caption;

    @Column(name = "display_order", nullable = false)
    private int displayOrder = 0;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected MemoryPhoto() {
    }

    public MemoryPhoto(LocalDate memoryDate, String storagePath, String caption, String originalFileName) {
        this.memoryDate = memoryDate;
        this.storagePath = storagePath;
        this.caption = (caption != null) ? caption : "";
        this.originalFileName = originalFileName;
        this.createdAt = LocalDateTime.now();
    }

    public MemoryPhoto(JournalEntry journalEntry, LocalDate memoryDate, String storagePath, String caption, String originalFileName) {
        this.journalEntry = journalEntry;
        this.memoryDate = memoryDate;
        this.storagePath = storagePath;
        this.caption = (caption != null) ? caption : "";
        this.originalFileName = originalFileName;
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

    public LocalDate getMemoryDate() {
        return memoryDate;
    }

    public void setMemoryDate(LocalDate memoryDate) {
        this.memoryDate = memoryDate;
    }

    public JournalEntry getJournalEntry() {
        return journalEntry;
    }

    public void setJournalEntry(JournalEntry journalEntry) {
        this.journalEntry = journalEntry;
    }

    public String getStoragePath() {
        return storagePath;
    }

    public void setStoragePath(String storagePath) {
        this.storagePath = storagePath;
    }

    public String getOriginalFileName() {
        return originalFileName;
    }

    public void setOriginalFileName(String originalFileName) {
        this.originalFileName = originalFileName;
    }

    public String getCaption() {
        return caption;
    }

    public void setCaption(String caption) {
        this.caption = caption;
    }

    public int getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(int displayOrder) {
        this.displayOrder = displayOrder;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
