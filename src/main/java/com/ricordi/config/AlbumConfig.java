package com.ricordi.config;

import java.time.LocalDate;
import org.springframework.stereotype.Component;

@Component
public class AlbumConfig {

    public static final int ALBUM_YEAR = 2027;
    public static final int DAYS_IN_ALBUM_YEAR = 365;
    public static final LocalDate ALBUM_START_DATE = LocalDate.of(2027, 1, 1);
    public static final LocalDate ALBUM_END_DATE = LocalDate.of(2027, 12, 31);

    public int getAlbumYear() {
        return ALBUM_YEAR;
    }

    public int getDaysInAlbumYear() {
        return DAYS_IN_ALBUM_YEAR;
    }

    public LocalDate getAlbumStartDate() {
        return ALBUM_START_DATE;
    }

    public LocalDate getAlbumEndDate() {
        return ALBUM_END_DATE;
    }

    public boolean isWithinAlbumYear(LocalDate date) {
        return date != null && !date.isBefore(ALBUM_START_DATE) && !date.isAfter(ALBUM_END_DATE);
    }
}
