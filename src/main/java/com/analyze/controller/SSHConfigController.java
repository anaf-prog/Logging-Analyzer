package com.analyze.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.analyze.entity.SSHConfig;
import com.analyze.service.SSHConfigService;
import com.analyze.service.SSHLogService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

@RestController
@RequestMapping("/api/ssh-configs")
public class SSHConfigController {

    @Autowired
    private SSHConfigService sshConfigService;

    @Autowired
    private SSHLogService sshLogService;

    @GetMapping
    public List<SSHConfig> list() {
        return sshConfigService.getAllConfigs();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SSHConfig create(@Valid @RequestBody SSHConfigRequest request) {
        return sshConfigService.create(
                request.name(),
                request.host(),
                request.port(),
                request.username(),
                request.password(),
                request.sudoPassword(),
                request.logPath(),
                request.enabled());
    }

    @PutMapping("/{id}")
    public SSHConfig update(@PathVariable("id") Long id, @Valid @RequestBody SSHConfigRequest request) {
        return sshConfigService.update(
                id,
                request.name(),
                request.host(),
                request.port(),
                request.username(),
                request.password(),
                request.sudoPassword(),
                request.logPath(),
                request.enabled());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable("id") Long id) {
        sshConfigService.delete(id);
    }

    @PostMapping("/test-connection")
    public ResponseEntity<TestConnectionResponse> testConnection(@Valid @RequestBody SSHConnectionTestRequest request) {
        try {
            sshLogService.testConnection(request.host(), request.port(), request.username(), request.password());
            return ResponseEntity.ok(new TestConnectionResponse(true, "Koneksi SSH berhasil."));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest()
                    .body(new TestConnectionResponse(false, e.getMessage()));
        }
    }

    public record SSHConfigRequest(
            @NotBlank String name,
            @NotBlank String host,
            @Min(1) @Max(65535) Integer port,
            @NotBlank String username,
            @NotBlank String password,
            String sudoPassword,
            String logPath,
            boolean enabled) {
    }

    public record SSHConnectionTestRequest(
            @NotBlank String host,
            @Min(1) @Max(65535) Integer port,
            @NotBlank String username,
            @NotBlank String password) {
    }

    public record TestConnectionResponse(boolean success, String message) {
    }
}
