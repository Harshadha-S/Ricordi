package com.ricordi.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class MemoryController {

    @GetMapping("/memories")
    public String archive() {
        return "memories/archive";
    }

    @GetMapping("/memories/on-this-day")
    public String onThisDay() {
        return "memories/on-this-day";
    }
}

