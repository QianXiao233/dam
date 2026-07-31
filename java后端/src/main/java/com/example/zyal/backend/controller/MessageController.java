package com.example.zyal.backend.controller;

import com.example.zyal.backend.service.Message;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.example.zyal.backend.service.MessagelistService;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class MessageController {
    //接收python发送的消息并创建消息对象加入消息列表
    //注入MessagelistService组件
    @Autowired
    MessagelistService messagelistService;
    @PostMapping("/add_message")
    public Map<String, Object> add_message(@RequestParam int level, @RequestParam String type, @RequestParam String content) {
        Map<String, Object> map = new HashMap<>();
        Message message = new Message(UUID.randomUUID().toString(), level, type, content);
        messagelistService.addMessage(message);
        map.put("messageid", message.getId());
        return map;
    }
    @PostMapping("/delete_message")
    public Map<String, Object> delete_message(@RequestParam String id) {
        Map<String, Object> map = new HashMap<>();
        messagelistService.deleteMessageById(id);
        map.put("messageid", id);
        return map;
    }
    @GetMapping("/get_messagelist")
    public Map<String, Object> get_messagelist() {
        Map<String, Object> map = new HashMap<>();
        map.put("messagelist", messagelistService.getMessagelist());
        return map;
    }
    @GetMapping("/get_message")
    public Message get_message() {
        return messagelistService.getMessage();
    }
    @GetMapping("/get_messagecount")
    public int get_messagecpunt() {
        return messagelistService.getMessageCount();
    }
    //启动本地三维应用（UE5 exe）接口：POST /api/startApp?exePath=xxx
    @PostMapping("/startApp")
    public Map<String, Object> startApp(@RequestParam String exePath) {
        Map<String, Object> map = new HashMap<>();
        if (exePath == null || exePath.trim().isEmpty()) {
            map.put("success", false);
            map.put("message", "exePath 不能为空");
            return map;
        }
        try {
            ProcessBuilder pb = new ProcessBuilder(exePath);
            pb.start();
            map.put("success", true);
            map.put("message", "应用启动成功");
        } catch (Exception e) {
            map.put("success", false);
            map.put("message", e.getMessage());
        }
        return map;
    }
}
