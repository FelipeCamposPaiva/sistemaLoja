package com.temdetudo.erp.whatsapp;

public class ZapiCredenciais {

    private String instanceId = "";
    private String token = "";
    private String clientToken = "";

    public String getInstanceId() {
        return instanceId;
    }

    public void setInstanceId(String instanceId) {
        this.instanceId = instanceId == null ? "" : instanceId.trim();
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token == null ? "" : token.trim();
    }

    public String getClientToken() {
        return clientToken;
    }

    public void setClientToken(String clientToken) {
        this.clientToken = clientToken == null ? "" : clientToken.trim();
    }

    public boolean preenchida() {
        return !instanceId.isBlank() && !token.isBlank() && !clientToken.isBlank();
    }
}
