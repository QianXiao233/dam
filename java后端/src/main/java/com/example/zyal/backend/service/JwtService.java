package com.example.zyal.backend.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtService {

    // 密钥（至少32位）
    private static final String SECRET = "mER18sl8Ct/K7uiclSLIdXElhcC1Htcv1TgInl36LaI=";

    // 过期时间（7天）
    private static final long EXPIRE = 7 * 24 * 60 * 60 * 1000;

    // 生成密钥
    private Key getKey() {
        return Keys.hmacShaKeyFor(SECRET.getBytes());
    }

    // 生成 Token
    public String generateToken(String username, Integer level) {
        return Jwts.builder()
                .setSubject(username)
                .claim("level", level)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRE))
                .signWith(getKey())
                .compact();
    }

    // 验证 Token
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(getKey()).build().parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    // 获取用户名
    public String getUsername(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claims.getSubject();
    }

    // 获取用户等级
    public Integer getLevel(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claims.get("level", Integer.class);
    }
}