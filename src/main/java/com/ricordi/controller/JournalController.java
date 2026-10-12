package com.ricordi.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class JournalController {

    @GetMapping("/journal/new")
    public String newEntry() {
        return "journal/new-entry";
    }

    @GetMapping("/journal/entries/{id}")
    public String viewEntry() {
        return "journal/view-entry";
    }

    @GetMapping("/journal/entries/{id}/edit")
    public String editEntry() {
        return "journal/edit-entry";
    }
}

