package com.ricordi;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class PromptApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("GET /api/prompts should return assigned prompt for valid 2027 date")
    void testGetPromptForValid2027Date() throws Exception {
        mockMvc.perform(get("/api/prompts")
                .param("date", "2027-01-01")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.date").value("2027-01-01"))
                .andExpect(jsonPath("$.dayOfYear").value(1))
                .andExpect(jsonPath("$.totalDays").value(365))
                .andExpect(jsonPath("$.questionId").exists())
                .andExpect(jsonPath("$.questionText").exists());
    }

    @Test
    @DisplayName("GET /api/prompts/all should return all 365 prompts for 2027")
    void testGetAllPromptsForYear() throws Exception {
        mockMvc.perform(get("/api/prompts/all")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(365))
                .andExpect(jsonPath("$[0].date").value("2027-01-01"))
                .andExpect(jsonPath("$[364].date").value("2027-12-31"));
    }

    @Test
    @DisplayName("GET /api/prompts should return 400 Bad Request for date outside 2027")
    void testGetPromptForDateOutside2027() throws Exception {
        mockMvc.perform(get("/api/prompts")
                .param("date", "2026-05-15")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }
}
