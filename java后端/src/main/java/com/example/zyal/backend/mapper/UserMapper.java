package com.example.zyal.backend.mapper;  // 注意：不要 .mapper

import com.example.zyal.backend.service.UserService;
import org.apache.ibatis.annotations.*;
import java.util.List;

@Mapper
public interface UserMapper {

    // 根据用户名和密码查询用户（登录用）
    @Select("SELECT * FROM user BINARY WHERE username = #{username} AND password = #{password}")
    UserService login(@Param("username") String username, @Param("password") String password);

    // 根据用户名查询用户（检查用户名是否存在）
    @Select("SELECT * FROM user WHERE BINARY username = #{username}")
    UserService findByUsername(String username);

    // 查询所有用户
    @Select("SELECT * FROM user")
    List<UserService> findAll();

    // 根据ID查询用户
    @Select("SELECT * FROM user WHERE id = #{id}")
    UserService findById(Long id);

    // 新增用户
    @Insert("INSERT INTO user(username, password, level) VALUES(#{username}, #{password}, #{level})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(UserService user);
}