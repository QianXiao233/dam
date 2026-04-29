package com.example.zyal.backend.service;

import org.springframework.stereotype.Service;
import javax.annotation.PostConstruct;
import java.security.KeyPair;
import java.security.PrivateKey;
import java.security.PublicKey;

@Service
public class KeyService {

    private PublicKey publicKey;
    private PrivateKey privateKey;
    private String publicKeyString;

    @PostConstruct
    public void init() throws Exception {
        // 启动时生成密钥对（生产环境应固定密钥）
        KeyPair keyPair = RsaService.generateKeyPair();
        this.publicKey = keyPair.getPublic();
        this.privateKey = keyPair.getPrivate();
        this.publicKeyString = RsaService.getPublicKeyString(publicKey);
        System.out.println("RSA密钥对生成成功");
    }

    public String getPublicKeyString() {
        return publicKeyString;
    }

    public PrivateKey getPrivateKey() {
        return privateKey;
    }
}