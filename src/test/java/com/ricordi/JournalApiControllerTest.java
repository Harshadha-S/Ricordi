package com.ricordi;

import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class JournalApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("POST /api/journal should save journal entry and GET should retrieve it")
    void testSaveAndGetJournalEntry() throws Exception {
        Map<String, String> payload = Map.of(
                "date", "2027-03-10",
                "content", "Writing my reflection for March 10th."
        );

        mockMvc.perform(post("/api/journal")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.date").value("2027-03-10"))
                .andExpect(jsonPath("$.content").value("Writing my reflection for March 10th."));

        mockMvc.perform(get("/api/journal")
                .param("date", "2027-03-10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.date").value("2027-03-10"))
                .andExpect(jsonPath("$.content").value("Writing my reflection for March 10th."));
    }

    @Test
    @DisplayName("POST /api/journal should return 400 Bad Request for date outside 2027")
    void testSaveJournalEntryOutside2027() throws Exception {
        Map<String, String> payload = Map.of(
                "date", "2026-10-10",
                "content", "Invalid date entry."
        );

        mockMvc.perform(post("/api/journal")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }
}
