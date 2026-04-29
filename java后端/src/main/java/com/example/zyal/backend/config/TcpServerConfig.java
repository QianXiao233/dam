package com.example.zyal.backend.config;

import com.example.zyal.backend.service.TcpServer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TcpServerConfig {

    @Value("${tcp.server.port:8082}")
    private int tcpPort;

    @Bean
    public TcpServer tcpServer() {
        return new TcpServer(tcpPort);
    }
}