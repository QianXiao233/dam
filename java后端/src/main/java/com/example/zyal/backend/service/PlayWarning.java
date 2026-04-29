package com.example.zyal.backend.service;

import javazoom.jl.decoder.JavaLayerException;
import javazoom.jl.player.Player;
import org.springframework.stereotype.Service;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;

@Service
public class PlayWarning {
    public void warning(int a) throws IOException, JavaLayerException {
        if (a >= 60 && a < 65) {
            play("D:\\后端\\hydraulic\\src\\main\\resources\\static\\play1.mp3");  // 使用相对路径
        }
    }

    public static void play(String filePath) throws IOException, JavaLayerException {
        // 使用类加载器获取资源流（适用于打包后的JAR）
        try (FileInputStream fis = new FileInputStream(new File(filePath));
             BufferedInputStream bis = new BufferedInputStream(fis)) {

            Player player = new Player(bis);
            player.play();  // 阻塞直到播放完成
        }
    }

}