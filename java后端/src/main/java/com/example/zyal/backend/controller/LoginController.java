package com.example.zyal.backend.controller;

import com.example.zyal.backend.mapper.UserMapper;
import com.example.zyal.backend.service.JwtService;
import com.example.zyal.backend.service.KeyService;
import com.example.zyal.backend.service.RsaService;
import com.example.zyal.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class LoginController {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private KeyService keyService;

    @Autowired
    private JwtService jwtService;

    @PostMapping("/login")
    public Map<String, Object> login(@RequestParam String username,
                                     @RequestParam String enpassword) {
        Map<String, Object> result = new HashMap<>();

        try {
            // 尝试解密
            String password = RsaService.decrypt(enpassword, keyService.getPrivateKey());

            // 查询用户
            UserService user = userMapper.findByUsername(username);

            // 验证密码
            if (user != null && password.equals(user.getPassword())) {
                result.put("success", true);
                result.put("message", "登录成功");
                Integer Level = user.getLevel();
                String token = jwtService.generateToken(username, Level);
                result.put("token", token);
            } else {
                result.put("success", false);
                result.put("message", "用户名或密码错误");
            }

        } catch (Exception e) {
            // 解密失败
            result.put("success", false);
            result.put("message", "登录失败，请重试");
        }

        return result;
    }

    @PostMapping("/register")
    public Map<String, Object> register(@RequestParam String username,
                                        @RequestParam String enpassword,
                                        @RequestParam Integer Level) {
        Map<String, Object> result = new HashMap<>();
        try {
            // RSA后端解密功能，测试版本未开启
            // String password = RsaUtil.decrypt(enpassword,keyService.getPrivateKey());

            UserService user = userMapper.findByUsername(username);
            if (user == null) {
                UserService newUser = new UserService();
                newUser.setUsername(username);
                newUser.setPassword(enpassword);
                newUser.setLevel(Level);
                userMapper.insert(newUser);
                result.put("success", true);
                result.put("message", "注册成功！");
            } else {
                result.put("success", false);
                result.put("message", "用户已存在");
            }
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "发生未知错误，服务不可用，请联系后端服务人员");
        }
        return result;
    }

    @PostMapping("/validate")
    public Map<String, Object> validateToken(@RequestParam String token) {
        Map<String, Object> result = new HashMap<>();
        if (!jwtService.validateToken(token)) {
            result.put("success", false);
            result.put("message", "凭证验证失败!");
        } else {
            String username = jwtService.getUsername(token);
            Integer level = jwtService.getLevel(token);
            result.put("success", true);
            result.put("message", "验证成功！");
            result.put("username", username);
            result.put("level", level);
        }
        return result;
    }

    /**
     * 启动本地exe程序（需要token验证）
     */
    @PostMapping("/startApp")
    public Map<String, Object> startApp(
                                        @RequestParam String exePath) {
        Map<String, Object> result = new HashMap<>();

        try {

            // 执行exe程序
            Runtime.getRuntime().exec(exePath);

            result.put("success", true);
            result.put("message", "应用启动成功！");
            result.put("exePath", exePath);

        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "启动应用失败：" + e.getMessage());
        }

        return result;
    }
}