package com.ricordi.service;

import com.ricordi.config.AlbumConfig;
import com.ricordi.model.MemoryPhoto;
import com.ricordi.model.User;
import com.ricordi.repository.MemoryPhotoRepository;
import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class MemoryService {

    private final MemoryPhotoRepository memoryPhotoRepository;
    private final PhotoStorageService photoStorageService;
    private final AlbumConfig albumConfig;

    public MemoryService(
            MemoryPhotoRepository memoryPhotoRepository,
            PhotoStorageService photoStorageService,
            AlbumConfig albumConfig) {
        this.memoryPhotoRepository = memoryPhotoRepository;
        this.photoStorageService = photoStorageService;
        this.albumConfig = albumConfig;
    }

    public List<MemoryPhoto> findPhotosForEntry(Long journalEntryId) {
        return memoryPhotoRepository.findAllByJournalEntryId(journalEntryId);
    }

    @Transactional(readOnly = true)
    public List<MemoryPhoto> getPhotosForDate(LocalDate date) {
        albumConfig.isWithinAlbumYear(date);
        return memoryPhotoRepository.findByMemoryDateOrderByDisplayOrderAscCreatedAtAsc(date);
    }

    @Transactional
    public MemoryPhoto uploadPhotoForDate(LocalDate date, MultipartFile file, String caption, User user) throws IOException {
        if (!albumConfig.isWithinAlbumYear(date)) {
            throw new IllegalArgumentException("Date " + date + " is outside album year " + albumConfig.getAlbumYear());
        }

        long existingCount = memoryPhotoRepository.countByMemoryDate(date);
        if (existingCount >= 3) {
            throw new IllegalArgumentException("Maximum 3 photos allowed per date. Page is full.");
        }

        String storedFilename = photoStorageService.store(file);
        String storagePath = "/uploads/" + storedFilename;
        String originalName = file.getOriginalFilename();

        MemoryPhoto photo = new MemoryPhoto(date, storagePath, caption, originalName);
        photo.setDisplayOrder((int) existingCount);
        return memoryPhotoRepository.save(photo);
    }

    @Transactional
    public MemoryPhoto updateCaption(Long photoId, String newCaption) {
        MemoryPhoto photo = memoryPhotoRepository.findById(photoId)
                .orElseThrow(() -> new IllegalArgumentException("Photo not found with id: " + photoId));

        photo.setCaption(newCaption != null ? newCaption : "");
        return memoryPhotoRepository.save(photo);
    }

    @Transactional
    public void reorderPhotos(LocalDate date, List<Long> photoIds) {
        if (!albumConfig.isWithinAlbumYear(date)) {
            throw new IllegalArgumentException("Date " + date + " is outside album year " + albumConfig.getAlbumYear());
        }
        if (photoIds == null || photoIds.isEmpty()) return;

        for (int i = 0; i < photoIds.size(); i++) {
            Long id = photoIds.get(i);
            Optional<MemoryPhoto> opt = memoryPhotoRepository.findById(id);
            if (opt.isPresent()) {
                MemoryPhoto photo = opt.get();
                if (photo.getMemoryDate().equals(date)) {
                    photo.setDisplayOrder(i);
                    memoryPhotoRepository.save(photo);
                }
            }
        }
    }

    @Transactional
    public void deletePhoto(Long photoId) {
        Optional<MemoryPhoto> opt = memoryPhotoRepository.findById(photoId);
        if (opt.isPresent()) {
            MemoryPhoto photo = opt.get();
            photoStorageService.delete(photo.getStoragePath());
            memoryPhotoRepository.delete(photo);
        }
    }

    @Transactional(readOnly = true)
    public List<MemoryPhoto> getAllPhotosForAlbumYear() {
        return memoryPhotoRepository.findByMemoryDateBetweenOrderByMemoryDateAscDisplayOrderAscCreatedAtAsc(
                albumConfig.getAlbumStartDate(),
                albumConfig.getAlbumEndDate()
        );
    }
}
