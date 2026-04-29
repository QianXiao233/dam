package com.example.zyal.backend.service;

import org.apache.commons.codec.DecoderException;
import org.apache.commons.codec.binary.Hex;
import org.springframework.stereotype.Service;

//控制算法，写的头晕眼花
@Service
public class RelayControl {

    private int i = 0;
    private int lastI = -1; //记录上一次返回时的i值
    private boolean isOpen = false; // 控制开/关命令

    public byte[] OpenAndClose() throws DecoderException {
        if (i != lastI) {
            String response;
            if (isOpen) {
                System.out.println("继电器打开指令准备完成");
                response = "AA11010101DBBB"; // command2（开）
            } else {
                System.out.println("继电器关闭指令准备完成");
                response = "AA11010100DBBB"; // command1（关）
            }
            lastI = i;
            return hexStringToByteArray(response);
        }
        return null;
    }

    // 设置开/关状态布尔值，在控制器里面调用的，防止socket重复发送指令返回信息，减少数据解析的问题
    public void setIsOpen(boolean isOpen) {
        this.isOpen = isOpen;
    }

    // 只发送一次指令也是在控制器里调用的，外部接口调用控制器，理论上任何终端设备都可以控制包括手机
    public void setI(int i) {
        this.i = i;
    }

    public static byte[] hexStringToByteArray(String hex) throws DecoderException {
        return Hex.decodeHex(hex.toCharArray());
    }
}
