package com.example.zyal.backend.service;

import javazoom.jl.decoder.JavaLayerException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
@Component
public class WebSocketService extends TextWebSocketHandler {
    private int[] cachedData = new int[6];
    private static Set<WebSocketSession> clients = new HashSet<>();

    //@Autowired
    //private LevelProcesser levelProcesser;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        clients.add(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        clients.remove(session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        // 处理从客户端接收的消息
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        // 处理传输错误
    }
    public void sendMessage(String data) throws IOException, JavaLayerException {
        int[] array = convertData(data);
        //处理水位并生成消息
        //levelProcesser.processLevel(array[0]);
        String resultData = convertArrayToJson(array);
        PythonProt pythonProt = new PythonProt();
        String predict = pythonProt.predict(array);
        String combinedData = "["+resultData+","+predict+"]";
        for (WebSocketSession client : clients) {
            try {
                client.sendMessage(new TextMessage(combinedData));
            } catch (IOException e) {
                e.printStackTrace();
            }
        }

    }

    public int[] convertData(String str) {
        if (str.length()>=16){
            char[] chars = str.toCharArray();
            char[] liquidLevel = Arrays.copyOfRange(chars, 8, 12);
//            System.out.println(liquidLevel);
            char[] turbidity = Arrays.copyOfRange(chars, 12, 16);
            char[] shake = Arrays.copyOfRange(chars, 16, 20);
            char[] soilHumidity = Arrays.copyOfRange(chars, 20, 24);
            char[] heelingCondition = Arrays.copyOfRange(chars, 24, 26);
            char[] pumpStatus = Arrays.copyOfRange(chars, 26, 28);

            // 将char[]转换为String
            int[] result = new int[6];
            result[0] = Integer.parseInt(new String(liquidLevel),16);
            result[1] = Integer.parseInt(new String(turbidity),16);
            result[2] = Integer.parseInt(new String(shake),16);
            result[3] = Integer.parseInt(new String(soilHumidity),16);
            result[4] = Integer.parseInt(new String(heelingCondition),16);
            result[5] = Integer.parseInt(new String(pumpStatus),16);

            cachedData = result;
            System.out.println(Arrays.toString(cachedData));
            return result;
        }

        return cachedData;
    }
    private String convertArrayToJson(int[] array) {
        // 将数组转换为JSON字符串
        StringBuilder sb = new StringBuilder();
        sb.append("["); // 开始数组
        for (int i = 0; i < array.length; i++) {
            sb.append(array[i]); // 添加数组元素的值
            if (i < array.length - 1) { // 如果不是最后一个元素，则添加逗号
                sb.append(",");
            }
        }
        sb.append("]"); // 结束数组
        return sb.toString();
    }
}