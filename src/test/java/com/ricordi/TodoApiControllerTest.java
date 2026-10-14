package com.ricordi;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class TodoApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("GET /api/todos should return list of tasks")
    void testGetTodos() throws Exception {
        mockMvc.perform(get("/api/todos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", isA(java.util.List.class)));
    }

    @Test
    @DisplayName("POST /api/todos creates task; PATCH toggles it; DELETE removes it")
    void testTaskLifecycle() throws Exception {
        Map<String, String> payload = Map.of(
                "title", "Press autumn leaves between parchment",
                "dueDate", "2027-10-15"
        );

        MvcResult postResult = mockMvc.perform(post("/api/todos")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.title").value("Press autumn leaves between parchment"))
                .andExpect(jsonPath("$.dueDate").value("2027-10-15"))
                .andExpect(jsonPath("$.completed").value(false))
                .andReturn();

        String responseJson = postResult.getResponse().getContentAsString();
        Map<?, ?> taskMap = objectMapper.readValue(responseJson, Map.class);
        Number idNum = (Number) taskMap.get("id");
        Long taskId = idNum.longValue();

        // Toggle task
        mockMvc.perform(patch("/api/todos/" + taskId + "/toggle"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(taskId))
                .andExpect(jsonPath("$.completed").value(true));

        // Delete task
        mockMvc.perform(delete("/api/todos/" + taskId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"));

        // Delete again should return 404
        mockMvc.perform(delete("/api/todos/" + taskId))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/todos rejects blank title with 400 Bad Request")
    void testRejectBlankTitle() throws Exception {
        Map<String, String> payload = Map.of("title", "   ");

        mockMvc.perform(post("/api/todos")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }
}
