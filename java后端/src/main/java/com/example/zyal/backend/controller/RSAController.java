package com.example.zyal.backend.controller;

import com.example.zyal.backend.service.KeyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class RSAController {

    @Autowired
    private KeyService keyService;

    @GetMapping("/get_rsa")
    public String getPublicKey() {
        String publicKey = keyService.getPublicKeyString();
        return publicKey;
    }
}