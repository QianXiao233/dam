package com.example.zyal.backend.controller;


import com.example.zyal.backend.service.RelayControl;
import com.example.zyal.backend.service.WebSocketService;
import javazoom.jl.decoder.JavaLayerException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;

@RestController
@RequestMapping("/RelayControl")
public class PumpController {
    @Autowired
    RelayControl relayControl;
    @RequestMapping ("/Open")
    public void Open(){
        System.out.println("继电器打开指令收到");
        relayControl.setI(1);
        relayControl.setIsOpen(true);
    }
    @RequestMapping ("/Close")
    public void Close(){
        System.out.println("继电器关闭指令收到");
        relayControl.setI(0);
        relayControl.setIsOpen(false);
    }

}
