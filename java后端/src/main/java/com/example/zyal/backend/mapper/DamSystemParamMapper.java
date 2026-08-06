package com.example.zyal.backend.mapper;

import com.example.zyal.backend.service.DamSystemParam;
import org.apache.ibatis.annotations.*;
import java.util.List;

@Mapper
public interface DamSystemParamMapper {

    @Select("SELECT * FROM dam_system_param ORDER BY param_id")
    List<DamSystemParam> findAll();

    @Select("SELECT * FROM dam_system_param WHERE param_id = #{paramId}")
    DamSystemParam findById(Integer paramId);

    @Insert("INSERT INTO dam_system_param(param_code, param_name, param_low_value, param_high_value, param_type, remark) " +
            "VALUES(#{paramCode}, #{paramName}, #{paramLowValue}, #{paramHighValue}, #{paramType}, #{remark})")
    @Options(useGeneratedKeys = true, keyProperty = "paramId")
    int insert(DamSystemParam param);

    @Update("UPDATE dam_system_param SET param_code=#{paramCode}, param_name=#{paramName}, " +
            "param_low_value=#{paramLowValue}, param_high_value=#{paramHighValue}, " +
            "param_type=#{paramType}, remark=#{remark} WHERE param_id=#{paramId}")
    int update(DamSystemParam param);

    @Delete("DELETE FROM dam_system_param WHERE param_id = #{paramId}")
    int delete(Integer paramId);
}
