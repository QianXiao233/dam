package com.example.zyal.backend.service;

import javax.annotation.PreDestroy;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.atomic.AtomicBoolean;
import javazoom.jl.decoder.JavaLayerException;
import org.apache.commons.codec.DecoderException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;

public class TcpServer {
    @Autowired
    RelayControl relayControl;

    @Value("${tcp.server.port:8082}")
    private final int port;
    private ServerSocket serverSocket;
    private final AtomicBoolean running = new AtomicBoolean(false);
    private ExecutorService clientThreadPool;

    public TcpServer(int port) {
        this.port = port;
    }

    public void start() {
        if (running.compareAndSet(false, true)) {
            try {
                serverSocket = new ServerSocket(port);
                clientThreadPool = Executors.newCachedThreadPool();
                System.out.println("[TCP] 服务器启动成功，监听端口: " + port);

                // 启动接受连接的线程
                new Thread(this::acceptConnections, "tcp-accept-thread").start();
            } catch (IOException e) {
                System.err.println("[TCP] 启动失败: " + e.getMessage());
                running.set(false);
            }
        }
    }

    private void acceptConnections() {
        while (running.get()) {
            try {
                Socket clientSocket = serverSocket.accept();
                String clientInfo = clientSocket.getInetAddress().getHostAddress() + ":" + clientSocket.getPort();
                System.out.println("[TCP] 客户端连接: " + clientInfo);

                clientThreadPool.execute(() -> handleClient(clientSocket, clientInfo));
            } catch (IOException e) {
                if (running.get()) {
                    System.err.println("[TCP] 接受连接错误: " + e.getMessage());
                }
            }
        }
    }

    private void handleClient(Socket clientSocket, String clientInfo) {
        try (InputStream input = clientSocket.getInputStream();
             OutputStream output = clientSocket.getOutputStream()) {
            byte[] buffer = new byte[1024];
            int bytesRead;

            while (running.get() && !clientSocket.isClosed()) {
                bytesRead = input.read(buffer);
                if (bytesRead == -1) {
                    break; // 客户端断开连接
                }
                // 将字节数组转换为十六进制字符串
                String hexReceived = bytesToHex(buffer, bytesRead);
                // 打印原始字节的十六进制表示
                System.out.println("[TCP] 来自 " + clientInfo + " 消息: " + hexReceived);
//                test.run(hexReceived);
                byte[] data = relayControl.OpenAndClose();
                if (data!=null){
                    output.write(data);
                    output.flush();
                    System.out.println("指令已发送");
                }
                if (hexReceived.length()>=16) {
                    WebSocketService webSocketService = new WebSocketService();
                    // 使用线程池发送WebSocket消息（注意：建议将scheduler和webSocketService移到类成员变量）
                    ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(3);
                    webSocketService.sendMessage(hexReceived);
                }
            }
        } catch (IOException e) {
            System.err.println("[TCP] 处理客户端错误: " + e.getMessage());
        } catch (DecoderException | JavaLayerException e) {
            throw new RuntimeException(e);
        } finally {
            closeClient(clientSocket, clientInfo);
        }
    }

    private void closeClient(Socket clientSocket, String clientInfo) {
        try {
            if (clientSocket != null && !clientSocket.isClosed()) {
                clientSocket.close();
            }
        } catch (IOException e) {
            System.err.println("[TCP] 关闭连接错误: " + e.getMessage());
        } finally {
            System.out.println("[TCP] 客户端断开: " + clientInfo);
        }
    }

    @PreDestroy
    public void stop() {
        if (running.compareAndSet(true, false)) {
            System.out.println("[TCP] 正在关闭服务器...");

            // 关闭线程池
            if (clientThreadPool != null) {
                clientThreadPool.shutdownNow();
            }

            // 关闭服务器套接字
            try {
                if (serverSocket != null && !serverSocket.isClosed()) {
                    serverSocket.close();
                }
            } catch (IOException e) {
                System.err.println("[TCP] 关闭服务器错误: " + e.getMessage());
            }

            System.out.println("[TCP] 服务器已停止");
        }
    }

    private static String bytesToHex(byte[] buffer, int bytesRead) {
        char[] hexChars = new char[bytesRead * 2];
        final char[] HEX_ARRAY = "0123456789ABCDEF".toCharArray();

        for (int i = 0; i < bytesRead; i++) {
            int v = buffer[i] & 0xFF; // 转换为无符号字节
            hexChars[i * 2] = HEX_ARRAY[v >>> 4];     // 高四位
            hexChars[i * 2 + 1] = HEX_ARRAY[v & 0x0F]; // 低四位
        }
        return new String(hexChars);
    }



}