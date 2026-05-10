package com.analyze.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import com.analyze.entity.MonitorConfig;
import com.analyze.entity.SSHConfig;
import com.analyze.service.MonitorConfigService;
import com.analyze.service.SSHConfigService;

@Controller
@RequestMapping("/monitor-configs")
public class MonitorConfigPageController {

    @Autowired
    private MonitorConfigService monitorConfigService;

    @Autowired
    private SSHConfigService sshConfigService;

    @GetMapping
    public String monitorConfigs(Model model) {
        List<MonitorConfig> monitorConfigs = monitorConfigService.getAllConfigs();
        List<SSHConfig> sshConfigs = sshConfigService.getAllConfigs();
        
        model.addAttribute("monitorConfigs", monitorConfigs);
        model.addAttribute("sshConfigs", sshConfigs);
        
        return "monitor-configs";
    }
}
