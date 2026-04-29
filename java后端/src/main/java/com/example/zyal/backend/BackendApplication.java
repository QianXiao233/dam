package com.example.zyal.backend;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import com.example.zyal.backend.service.TcpServer;

@SpringBootApplication
@MapperScan("com.example.zyal.backend.mapper")  // 扫描整个backend包
public class BackendApplication implements CommandLineRunner {
	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}
	@Autowired
	private TcpServer tcpServer;

	@Override  // 确保添加这个注解
	public void run(String... args) throws Exception {  // 添加 throws Exception
		// 启动 TCP 服务器
		tcpServer.start();
	}
}