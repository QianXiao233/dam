package com.example.zyal.backend.controller;

import com.example.zyal.backend.mapper.*;
import com.example.zyal.backend.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/manage")
public class ManageController {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private DamInfoMapper damInfoMapper;

    @Autowired
    private DamDeviceMapper damDeviceMapper;

    @Autowired
    private DamSystemParamMapper damSystemParamMapper;

    // ==================== Token 校验辅助方法 ====================
    private Map<String, Object> checkToken(String authHeader) {
        Map<String, Object> result = new HashMap<>();
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            result.put("success", false);
            result.put("message", "凭证验证失败!");
            return result;
        }
        String token = authHeader.substring(7);
        if (!jwtService.validateToken(token)) {
            result.put("success", false);
            result.put("message", "凭证验证失败!");
            return result;
        }
        result.put("success", true);
        result.put("username", jwtService.getUsername(token));
        result.put("level", jwtService.getLevel(token));
        return result;
    }

    // ==================== 用户管理 ====================

    @GetMapping("/user/list")
    public Map<String, Object> userList(@RequestHeader("Authorization") String auth) {
        Map<String, Object> result = checkToken(auth);
        if (!(boolean) result.get("success")) return result;
        List<UserService> list = userMapper.findAll();
        result.put("data", list);
        return result;
    }

    @PostMapping("/user/add")
    public Map<String, Object> userAdd(@RequestHeader("Authorization") String auth,
                                        @RequestParam String username,
                                        @RequestParam String password,
                                        @RequestParam Integer level) {
        Map<String, Object> result = checkToken(auth);
        if (!(boolean) result.get("success")) return result;

        UserService exist = userMapper.findByUsername(username);
        if (exist != null) {
            result.put("success", false);
            result.put("message", "用户名已存在");
            return result;
        }
        UserService user = new UserService();
        user.setUsername(username);
        user.setPassword(password);
        user.setLevel(level);
        userMapper.insert(user);
        result.put("success", true);
        result.put("message", "新增成功");
        return result;
    }

    @PostMapping("/user/update")
    public Map<String, Object> userUpdate(@RequestHeader("Authorization") String auth,
                                           @RequestParam Integer id,
                                           @RequestParam String username,
                                           @RequestParam String password,
                                           @RequestParam Integer level) {
        Map<String, Object> result = checkToken(auth);
        if (!(boolean) result.get("success")) return result;

        UserService user = userMapper.findById(Long.valueOf(id));
        if (user == null) {
            result.put("success", false);
            result.put("message", "用户不存在");
            return result;
        }
        user.setUsername(username);
        user.setPassword(password);
        user.setLevel(level);
        userMapper.update(user);
        result.put("success", true);
        result.put("message", "更新成功");
        return result;
    }

    @PostMapping("/user/delete")
    public Map<String, Object> userDelete(@RequestHeader("Authorization") String auth,
                                           @RequestParam Integer id) {
        Map<String, Object> result = checkToken(auth);
        if (!(boolean) result.get("success")) return result;
        userMapper.delete(Long.valueOf(id));
        result.put("success", true);
        result.put("message", "删除成功");
        return result;
    }

    // ==================== 大坝信息管理 ====================

    @GetMapping("/dam/list")
    public Map<String, Object> damList(@RequestHeader("Authorization") String auth) {
        Map<String, Object> result = checkToken(auth);
        if (!(boolean) result.get("success")) return result;
        List<DamInfo> list = damInfoMapper.findAll();
        result.put("data", list);
        return result;
    }

    @PostMapping("/dam/add")
    public Map<String, Object> damAdd(@RequestHeader("Authorization") String auth,
                                       @RequestParam Map<String, String> params) {
        Map<String, Object> result = checkToken(auth);
        if (!(boolean) result.get("success")) return result;
        DamInfo dam = new DamInfo();
        if (params.containsKey("dam_name")) dam.setDamName(params.get("dam_name"));
        if (params.containsKey("dam_type")) dam.setDamType(params.get("dam_type"));
        if (params.containsKey("river_name")) dam.setRiverName(params.get("river_name"));
        if (params.containsKey("location")) dam.setLocation(params.get("location"));
        if (params.containsKey("design_water_level") && !params.get("design_water_level").isEmpty())
            dam.setDesignWaterLevel(new java.math.BigDecimal(params.get("design_water_level")));
        if (params.containsKey("die_water_level") && !params.get("die_water_level").isEmpty())
            dam.setDieWaterLevel(new java.math.BigDecimal(params.get("die_water_level")));
        if (params.containsKey("flood_water_level") && !params.get("flood_water_level").isEmpty())
            dam.setFloodWaterLevel(new java.math.BigDecimal(params.get("flood_water_level")));
        if (params.containsKey("dam_height") && !params.get("dam_height").isEmpty())
            dam.setDamHeight(new java.math.BigDecimal(params.get("dam_height")));
        if (params.containsKey("dam_storage") && !params.get("dam_storage").isEmpty())
            dam.setDamStorage(new java.math.BigDecimal(params.get("dam_storage")));
        if (params.containsKey("control_area") && !params.get("control_area").isEmpty())
            dam.setControlArea(new java.math.BigDecimal(params.get("control_area")));
        if (params.containsKey("build_year")) dam.setBuildYear(params.get("build_year"));
        if (params.containsKey("status")) dam.setStatus(Integer.parseInt(params.get("status")));
        if (params.containsKey("remark")) dam.setRemark(params.get("remark"));
        damInfoMapper.insert(dam);
        result.put("success", true);
        result.put("message", "新增成功");
        return result;
    }

    @PostMapping("/dam/update")
    public Map<String, Object> damUpdate(@RequestHeader("Authorization") String auth,
                                          @RequestParam Map<String, String> params) {
        Map<String, Object> result = checkToken(auth);
        if (!(boolean) result.get("success")) return result;

        String damIdStr = params.get("dam_id");
        if (damIdStr == null) {
            result.put("success", false);
            result.put("message", "缺少 dam_id");
            return result;
        }
        DamInfo existing = damInfoMapper.findById(Integer.parseInt(damIdStr));
        if (existing == null) {
            result.put("success", false);
            result.put("message", "大坝不存在");
            return result;
        }
        // 合并前端传入的字段，保留未传字段的原值
        if (params.containsKey("dam_name")) existing.setDamName(params.get("dam_name"));
        if (params.containsKey("dam_type")) existing.setDamType(params.get("dam_type"));
        if (params.containsKey("river_name")) existing.setRiverName(params.get("river_name"));
        if (params.containsKey("location")) existing.setLocation(params.get("location"));
        if (params.containsKey("design_water_level") && !params.get("design_water_level").isEmpty())
            existing.setDesignWaterLevel(new java.math.BigDecimal(params.get("design_water_level")));
        if (params.containsKey("die_water_level") && !params.get("die_water_level").isEmpty())
            existing.setDieWaterLevel(new java.math.BigDecimal(params.get("die_water_level")));
        if (params.containsKey("flood_water_level") && !params.get("flood_water_level").isEmpty())
            existing.setFloodWaterLevel(new java.math.BigDecimal(params.get("flood_water_level")));
        if (params.containsKey("dam_height") && !params.get("dam_height").isEmpty())
            existing.setDamHeight(new java.math.BigDecimal(params.get("dam_height")));
        if (params.containsKey("dam_storage") && !params.get("dam_storage").isEmpty())
            existing.setDamStorage(new java.math.BigDecimal(params.get("dam_storage")));
        if (params.containsKey("control_area") && !params.get("control_area").isEmpty())
            existing.setControlArea(new java.math.BigDecimal(params.get("control_area")));
        if (params.containsKey("build_year")) existing.setBuildYear(params.get("build_year"));
        if (params.containsKey("status")) existing.setStatus(Integer.parseInt(params.get("status")));
        if (params.containsKey("remark")) existing.setRemark(params.get("remark"));

        damInfoMapper.update(existing);
        result.put("success", true);
        result.put("message", "更新成功");
        return result;
    }

    @PostMapping("/dam/delete")
    public Map<String, Object> damDelete(@RequestHeader("Authorization") String auth,
                                          @RequestParam Integer damId) {
        Map<String, Object> result = checkToken(auth);
        if (!(boolean) result.get("success")) return result;
        damInfoMapper.delete(damId);
        result.put("success", true);
        result.put("message", "删除成功");
        return result;
    }

    // ==================== 设备管理 ====================

    @GetMapping("/device/list")
    public Map<String, Object> deviceList(@RequestHeader("Authorization") String auth) {
        Map<String, Object> result = checkToken(auth);
        if (!(boolean) result.get("success")) return result;
        List<DamDevice> list = damDeviceMapper.findAll();
        result.put("data", list);
        return result;
    }

    @PostMapping("/device/add")
    public Map<String, Object> deviceAdd(@RequestHeader("Authorization") String auth,
                                          @RequestParam Map<String, String> params) {
        Map<String, Object> result = checkToken(auth);
        if (!(boolean) result.get("success")) return result;
        DamDevice device = new DamDevice();
        if (params.containsKey("device_name")) device.setDeviceName(params.get("device_name"));
        if (params.containsKey("device_code")) device.setDeviceCode(params.get("device_code"));
        if (params.containsKey("device_type")) device.setDeviceType(params.get("device_type"));
        if (params.containsKey("dam_id")) device.setDamId(Integer.parseInt(params.get("dam_id")));
        if (params.containsKey("manufacturer")) device.setManufacturer(params.get("manufacturer"));
        if (params.containsKey("model")) device.setModel(params.get("model"));
        if (params.containsKey("protocol")) device.setProtocol(params.get("protocol"));
        if (params.containsKey("status")) device.setStatus(Integer.parseInt(params.get("status")));
        if (params.containsKey("install_position")) device.setInstallPosition(params.get("install_position"));
        if (params.containsKey("remark")) device.setRemark(params.get("remark"));
        damDeviceMapper.insert(device);
        result.put("success", true);
        result.put("message", "新增成功");
        return result;
    }

    @PostMapping("/device/update")
    public Map<String, Object> deviceUpdate(@RequestHeader("Authorization") String auth,
                                             @RequestParam Map<String, String> params) {
        Map<String, Object> result = checkToken(auth);
        if (!(boolean) result.get("success")) return result;

        String deviceIdStr = params.get("device_id");
        if (deviceIdStr == null) {
            result.put("success", false);
            result.put("message", "缺少 device_id");
            return result;
        }
        DamDevice existing = damDeviceMapper.findById(Integer.parseInt(deviceIdStr));
        if (existing == null) {
            result.put("success", false);
            result.put("message", "设备不存在");
            return result;
        }
        if (params.containsKey("device_name")) existing.setDeviceName(params.get("device_name"));
        if (params.containsKey("device_code")) existing.setDeviceCode(params.get("device_code"));
        if (params.containsKey("device_type")) existing.setDeviceType(params.get("device_type"));
        if (params.containsKey("dam_id")) existing.setDamId(Integer.parseInt(params.get("dam_id")));
        if (params.containsKey("manufacturer")) existing.setManufacturer(params.get("manufacturer"));
        if (params.containsKey("model")) existing.setModel(params.get("model"));
        if (params.containsKey("protocol")) existing.setProtocol(params.get("protocol"));
        if (params.containsKey("status")) existing.setStatus(Integer.parseInt(params.get("status")));
        if (params.containsKey("install_position")) existing.setInstallPosition(params.get("install_position"));
        if (params.containsKey("remark")) existing.setRemark(params.get("remark"));

        damDeviceMapper.update(existing);
        result.put("success", true);
        result.put("message", "更新成功");
        return result;
    }

    @PostMapping("/device/delete")
    public Map<String, Object> deviceDelete(@RequestHeader("Authorization") String auth,
                                             @RequestParam Integer deviceId) {
        Map<String, Object> result = checkToken(auth);
        if (!(boolean) result.get("success")) return result;
        damDeviceMapper.delete(deviceId);
        result.put("success", true);
        result.put("message", "删除成功");
        return result;
    }

    // ==================== 系统参数管理 ====================

    @GetMapping("/param/list")
    public Map<String, Object> paramList(@RequestHeader("Authorization") String auth) {
        Map<String, Object> result = checkToken(auth);
        if (!(boolean) result.get("success")) return result;
        List<DamSystemParam> list = damSystemParamMapper.findAll();
        result.put("data", list);
        return result;
    }

    @PostMapping("/param/add")
    public Map<String, Object> paramAdd(@RequestHeader("Authorization") String auth,
                                         @RequestParam Map<String, String> params) {
        Map<String, Object> result = checkToken(auth);
        if (!(boolean) result.get("success")) return result;
        DamSystemParam param = new DamSystemParam();
        if (params.containsKey("param_code")) param.setParamCode(params.get("param_code"));
        if (params.containsKey("param_name")) param.setParamName(params.get("param_name"));
        if (params.containsKey("param_low_value")) param.setParamLowValue(params.get("param_low_value"));
        if (params.containsKey("param_high_value")) param.setParamHighValue(params.get("param_high_value"));
        if (params.containsKey("param_type")) param.setParamType(params.get("param_type"));
        if (params.containsKey("remark")) param.setRemark(params.get("remark"));
        damSystemParamMapper.insert(param);
        result.put("success", true);
        result.put("message", "新增成功");
        return result;
    }

    @PostMapping("/param/update")
    public Map<String, Object> paramUpdate(@RequestHeader("Authorization") String auth,
                                            @RequestParam Map<String, String> params) {
        Map<String, Object> result = checkToken(auth);
        if (!(boolean) result.get("success")) return result;

        String paramIdStr = params.get("param_id");
        if (paramIdStr == null) {
            result.put("success", false);
            result.put("message", "缺少 param_id");
            return result;
        }
        DamSystemParam existing = damSystemParamMapper.findById(Integer.parseInt(paramIdStr));
        if (existing == null) {
            result.put("success", false);
            result.put("message", "参数不存在");
            return result;
        }
        if (params.containsKey("param_code")) existing.setParamCode(params.get("param_code"));
        if (params.containsKey("param_name")) existing.setParamName(params.get("param_name"));
        if (params.containsKey("param_low_value")) existing.setParamLowValue(params.get("param_low_value"));
        if (params.containsKey("param_high_value")) existing.setParamHighValue(params.get("param_high_value"));
        if (params.containsKey("param_type")) existing.setParamType(params.get("param_type"));
        if (params.containsKey("remark")) existing.setRemark(params.get("remark"));

        damSystemParamMapper.update(existing);
        result.put("success", true);
        result.put("message", "更新成功");
        return result;
    }

    @PostMapping("/param/delete")
    public Map<String, Object> paramDelete(@RequestHeader("Authorization") String auth,
                                            @RequestParam Integer paramId) {
        Map<String, Object> result = checkToken(auth);
        if (!(boolean) result.get("success")) return result;
        damSystemParamMapper.delete(paramId);
        result.put("success", true);
        result.put("message", "删除成功");
        return result;
    }
}
