// 1. 获取公钥
async function getPublicKey() {
    const response = await fetch(window.apiUrls.java_url+"/get_rsa");
    const data = await response.text();
    return data;
}

// 2. 使用 JSEncrypt 库加密密码
async function rsa(password) {
    // 获取公钥
    const publicKey = await getPublicKey();
    
    // 用公钥加密密码
    const encrypt = new JSEncrypt();
    encrypt.setPublicKey(publicKey);
    const encryptedPassword = encrypt.encrypt(password);
    return encryptedPassword
}