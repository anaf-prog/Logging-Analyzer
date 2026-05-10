package com.analyze.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import com.analyze.service.ResponseConfigService;
import com.analyze.service.SSHConfigService;

@Controller
@RequestMapping("/ssh-configs")
public class SSHConfigPageController {

    @Autowired
    private SSHConfigService sshConfigService;

    @Autowired
    private ResponseConfigService responseConfigService;

    @GetMapping
    public String page(Model model) {
        model.addAttribute("sshConfigs", sshConfigService.getAllConfigs());
        model.addAttribute("responseConfigs", responseConfigService.getAllConfigs());
        return "ssh-configs";
    }
}
