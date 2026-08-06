package com.example.zyal.backend.service;

import java.util.Date;

public class DamSystemParam {
    private Integer paramId;
    private String paramCode;
    private String paramName;
    private String paramLowValue;
    private String paramHighValue;
    private String paramType;
    private Date createTime;
    private String remark;

    public Integer getParamId() { return paramId; }
    public void setParamId(Integer paramId) { this.paramId = paramId; }

    public String getParamCode() { return paramCode; }
    public void setParamCode(String paramCode) { this.paramCode = paramCode; }

    public String getParamName() { return paramName; }
    public void setParamName(String paramName) { this.paramName = paramName; }

    public String getParamLowValue() { return paramLowValue; }
    public void setParamLowValue(String paramLowValue) { this.paramLowValue = paramLowValue; }

    public String getParamHighValue() { return paramHighValue; }
    public void setParamHighValue(String paramHighValue) { this.paramHighValue = paramHighValue; }

    public String getParamType() { return paramType; }
    public void setParamType(String paramType) { this.paramType = paramType; }

    public Date getCreateTime() { return createTime; }
    public void setCreateTime(Date createTime) { this.createTime = createTime; }

    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }
}
