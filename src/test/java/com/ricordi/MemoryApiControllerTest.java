package com.ricordi;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class MemoryApiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("POST /api/photos/upload should save photo and return details")
    void testUploadPhotoApi() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "memory.jpg",
                "image/jpeg",
                "test image payload".getBytes()
        );

        mockMvc.perform(multipart("/api/photos/upload")
                .file(file)
                .param("date", "2027-04-12")
                .param("caption", "My April memory"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.date").value("2027-04-12"))
                .andExpect(jsonPath("$.caption").value("My April memory"))
                .andExpect(jsonPath("$.url").value(org.hamcrest.Matchers.startsWith("/uploads/")));
    }

    @Test
    @DisplayName("GET /api/photos should retrieve uploaded photos for date")
    void testGetPhotosForDateApi() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "coffee.png",
                "image/png",
                "coffee image data".getBytes()
        );

        mockMvc.perform(multipart("/api/photos/upload")
                .file(file)
                .param("date", "2027-09-01")
                .param("caption", "Morning coffee"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/photos")
                .param("date", "2027-09-01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].caption").value("Morning coffee"));
    }

    @Test
    @DisplayName("POST /api/photos/upload should enforce 3 photos per date limit and return 400 Bad Request on 4th")
    void testMax3PhotosUploadLimitApi() throws Exception {
        String dateStr = "2027-11-15";

        for (int i = 1; i <= 3; i++) {
            MockMultipartFile file = new MockMultipartFile(
                    "file",
                    "pic" + i + ".jpg",
                    "image/jpeg",
                    ("data " + i).getBytes()
            );
            mockMvc.perform(multipart("/api/photos/upload")
                    .file(file)
                    .param("date", dateStr)
                    .param("caption", "Caption " + i))
                    .andExpect(status().isOk());
        }

        MockMultipartFile fourthFile = new MockMultipartFile(
                "file",
                "pic4.jpg",
                "image/jpeg",
                "data 4".getBytes()
        );
        mockMvc.perform(multipart("/api/photos/upload")
                .file(fourthFile)
                .param("date", dateStr)
                .param("caption", "Caption 4"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("Maximum 3 photos allowed per date")));
    }

    @Test
    @DisplayName("POST /api/photos/{id}/caption should update caption and DELETE should remove photo")
    void testUpdateCaptionAndDeletePhotoApi() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "trip.jpg",
                "image/jpeg",
                "trip photo".getBytes()
        );

        MvcResult result = mockMvc.perform(multipart("/api/photos/upload")
                .file(file)
                .param("date", "2027-10-05")
                .param("caption", "Initial caption"))
                .andExpect(status().isOk())
                .andReturn();

        String jsonResponse = result.getResponse().getContentAsString();
        Map<?, ?> map = objectMapper.readValue(jsonResponse, Map.class);
        Number idNum = (Number) map.get("id");
        Long photoId = idNum.longValue();

        Map<String, String> captionPayload = Map.of("caption", "Updated trip caption");
        mockMvc.perform(post("/api/photos/" + photoId + "/caption")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(captionPayload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.caption").value("Updated trip caption"));

        mockMvc.perform(delete("/api/photos/" + photoId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"));
    }

    @Test
    @DisplayName("POST /api/photos/reorder should update order of photos for date")
    void testReorderPhotosApi() throws Exception {
        Map<String, Object> reorderPayload = Map.of(
                "date", "2027-10-05",
                "photoIds", java.util.List.of(2, 1)
        );

        mockMvc.perform(post("/api/photos/reorder")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reorderPayload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"));
    }

    @Test
    @DisplayName("GET /api/photos/all should return list of all photos for 2027 album year")
    void testGetAllPhotosApi() throws Exception {
        mockMvc.perform(get("/api/photos/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }
}
