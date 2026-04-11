package com.analyze.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.analyze.service.LogScannerService;

@RestController
@RequestMapping("/log")
public class LogController {

    @Autowired
    private LogScannerService scannerService;

    @PostMapping("/scan")
    public String scan() {
        scannerService.scanAndProcess();
        return "SCAN DONE";
    }
    
}
