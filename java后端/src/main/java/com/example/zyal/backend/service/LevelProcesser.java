package com.example.zyal.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
@Component
//处理水位数据并生成消息的服务
public class LevelProcesser {


    // 水位级别常量
    public static final int LEVEL_GREEN = 0;   // 绿色 - 正常
    public static final int LEVEL_BLUE = 1;    // 蓝色 - 注意
    public static final int LEVEL_YELLOW = 2;  // 黄色 - 预警
    public static final int LEVEL_ORANGE = 3;  // 橙色 - 严重
    public static final int LEVEL_RED = 4;     // 红色 - 危险

    // 水位阈值
    private static final int GREEN_MAX = 50;    // 0-50: 绿色
    private static final int BLUE_MAX = 80;     // 50-80: 蓝色
    private static final int YELLOW_MAX = 100;  // 80-100: 黄色
    private static final int ORANGE_MAX = 120;  // 100-120: 橙色
    // 120以上: 红色

    /**
     * 根据水位值获取级别
     */
    @Autowired
    private MessagelistService messageService;
    public int getLevel(int waterLevel) {
        if (waterLevel < 50) {
            return LEVEL_GREEN;
        } else if (waterLevel < 80) {
            return LEVEL_BLUE;
        } else if (waterLevel < 100) {
            return LEVEL_YELLOW;
        } else if (waterLevel < 120) {
            return LEVEL_ORANGE;
        } else {
            return LEVEL_RED;
        }
    }
    /**
     * 处理水位并生成消息
     */
    public void processLevel(int waterLevel) {
        int level = getLevel(waterLevel);
        // 检查是否需要发送消息（水位变化导致级别变化时才发送）
        Integer lastLevel = getLastStoredLevel();

        if (lastLevel == null || lastLevel != level) {
            // 级别发生变化，发送消息
            sendLevelMessage(waterLevel, level);
            storeLevel(level);
        }
    }
    private void sendLevelMessage(int waterLevel, int level) {
        Message msg = new Message();
        msg.setType("WATER_LEVEL");
        // 根据级别设置消息级别
        switch (level) {
            case LEVEL_GREEN:
                msg.setLevel(level);
                msg.setContent("水位正常，无需操作");
                break;
            case LEVEL_BLUE:
                msg.setLevel(level);
                msg.setContent("注意观察，做好记录");
                break;
            case LEVEL_YELLOW:
                msg.setLevel(level);
                msg.setContent("加强巡查，准备预案");
                break;
            case LEVEL_ORANGE:
                msg.setLevel(level);
                msg.setContent("启动预警，准备排水");
                break;
            case LEVEL_RED:
                msg.setLevel(level);
                msg.setContent("紧急响应，立即排水！");
                break;
        }
        messageService.addMessage(msg);
        System.out.println("[水位级别] " + msg.getContent());
    }

    private Integer lastLevel = null;

    private Integer getLastStoredLevel() {
        return lastLevel;
    }

    private void storeLevel(int level) {
        this.lastLevel = level;
    }
}