package com.example.zyal.backend.service;

import com.google.gson.Gson;
import com.google.gson.JsonObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Arrays;

public class PythonProt {
    public static String[] Bp(String array) {  // 修改参数类型为String[]
        String address = "http://192.168.10.247:5000/predict";
        //String address = "http://127.0.0.1:5000/predict";
        try {
            // 创建 JSON 请求
            Gson gson = new Gson();
            String json = gson.toJson(array);

            // 发送 HTTP 请求
            URL url = new URL(address);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);
            conn.setConnectTimeout(200);
            conn.setReadTimeout(200);

            try(OutputStream os = conn.getOutputStream()) {
                os.write(json.getBytes("utf-8"));
            }catch (Exception e){
                System.out.println("人工智能程序准备中.........");
            }

            // 读取响应
            StringBuilder response = new StringBuilder();
            try(BufferedReader br = new BufferedReader(
                    new InputStreamReader(conn.getInputStream(), "utf-8"))) {
                String line;
                while ((line = br.readLine()) != null) {
                    response.append(line);
                }
            }catch (Exception e){
                System.out.println("人工智能程序准备中暂无预测数据");
            }

            String responseStr = response.toString();

            // 检查响应类型
            if (responseStr.startsWith("{")) { // JSON 对象
                JsonObject jsonObj = gson.fromJson(responseStr, JsonObject.class);
                if (jsonObj.has("status") && "collecting".equals(jsonObj.get("status").getAsString())) {
                    int received = jsonObj.get("received").getAsInt();
                    int needed = jsonObj.get("needed").getAsInt();
                    System.out.printf("数据积累中: 已收集 %d 个, 还需要 %d 个\n", received, needed);
                    return new String[0];
                }
            }
            else if (responseStr.startsWith("[")) { // JSON 数组
                return gson.fromJson(responseStr, String[].class);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return new String[0];
    }

    public String predict(int[] array) {

        // 3. 调用神经网络预测
        String[] result = Bp(String.valueOf(array[0]));

        // 4. 打印预测结果
        System.out.print("\n预测结果:");
        printArray(result);
        return Arrays.toString(result);
    }

    private static void printArray(String[] array) {
        System.out.print("[");
        for (int i = 0; i < array.length; i++) {
            System.out.print(array[i]);
            if (i < array.length - 1) {
                System.out.print(", ");
            }
        }
        System.out.println("]");
    }
}