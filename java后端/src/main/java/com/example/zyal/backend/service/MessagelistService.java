package com.example.zyal.backend.service;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class MessagelistService {
    private int messageCount=0;
    //初始化消息列表
    private List<Message> messageList = new CopyOnWriteArrayList<>();
    //添加消息
    public Message addMessage(Message message) {
        messageList.add(message);
        messageCount++;
        System.out.println("添加的消息内容为:"+message.getContent());
        System.out.println("消息列表数量:"+getMessageCount());
        return message;
    }
    //删除消息
    public void deleteMessageById(String id) {
        for (Message message : messageList) {
            if (message.getId().equals(id)) {
                messageList.remove(message);
                messageCount--;
                System.out.println("删除的消息ID为:"+id);
                System.out.println("消息列表数量:"+getMessageCount());
                return;
            }
        }
        System.out.println("Error:删除的消息ID不存在");
    }
    //获取消息列表
    public List<Message> getMessagelist() {
        return messageList;
    }
    //获取消息数量
    public int getMessageCount() {
        return messageCount;
    }
    public Message getMessage() {
        if(messageList.size()>0){
            return messageList.get(messageList.size()-1);
        }
        return null;
    }
}