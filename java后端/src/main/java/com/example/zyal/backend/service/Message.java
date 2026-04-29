package com.example.zyal.backend.service;

import java.util.UUID;

public class Message {
    private String id;
    private int level;
    private String type;
    private String content;
    //带参构造方法
    public Message(String id, int level, String type, String content) {
        this.id = id;
        this.level = level;
        this.type = type;
        this.content = content;
    }
    //无参构造方法
    public Message() {
        this.id = UUID.randomUUID().toString();
    }

    public String getId() {
        return id;
    }
    public int getLevel() {
        return level;
    }
    public String getType() {
        return type;
    }
    public String getContent() {
        return content;
    }
    public void setId(String id) {
        this.id = id;
    }
    public void setLevel(int level) {
        this.level = level;
    }
    public void setType(String type) {
        this.type = type;
    }
    public void setContent(String content) {
        this.content = content;
    }
}
