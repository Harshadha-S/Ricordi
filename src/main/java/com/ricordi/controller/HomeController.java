package com.ricordi.controller;

import com.ricordi.config.AlbumConfig;
import com.ricordi.model.DailyPrompt;
import com.ricordi.service.PromptService;
import java.time.LocalDate;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    private final PromptService promptService;
    private final AlbumConfig albumConfig;

    public HomeController(PromptService promptService, AlbumConfig albumConfig) {
        this.promptService = promptService;
        this.albumConfig = albumConfig;
    }

    @GetMapping("/")
    public String home(Model model) {
        LocalDate initialDate = albumConfig.getAlbumStartDate();
        DailyPrompt initialPrompt = promptService.getPromptForDate(initialDate);

        model.addAttribute("albumYear", albumConfig.getAlbumYear());
        model.addAttribute("totalDays", AlbumConfig.DAYS_IN_ALBUM_YEAR);
        model.addAttribute("initialDate", initialDate.toString());
        model.addAttribute("initialQuestionId", initialPrompt.getQuestionId());
        model.addAttribute("initialQuestionText", initialPrompt.getPromptText());

        return "index";
    }

    @GetMapping("/dashboard")
    public String dashboard() {
        return "dashboard";
    }

    @GetMapping("/album-demo")
    public String albumDemo() {
        return "album-demo";
    }
}
