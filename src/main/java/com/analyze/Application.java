package com.analyze;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import com.analyze.service.SSHLogService;

@SpringBootApplication
@EnableScheduling
public class Application implements CommandLineRunner {

	@Autowired
	private SSHLogService sshLogService;

	public static void main(String[] args) {
		SpringApplication.run(Application.class, args);
	}

	@Override
	public void run(String... args) throws Exception {
		sshLogService.remoteServer();
	}

}
