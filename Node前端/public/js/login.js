async function login() {
    // 清除错误提示
    const errors = ['username-error', 'password-empty-error', 'password-error-msg'];
    errors.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    
    const username = document.getElementById('username').value;
    if(username=="' or ''='"){
        document.getElementsByClassName('warning-modal')[0].classList.add('active');
        return;
    }
    if (!username) {
        document.getElementById('username-error').style.display = 'block';
        return;
    }
    
    const password = document.getElementById('password').value;
    if (!password) {
        document.getElementById('password-empty-error').style.display = 'block';
        return;
    }
    
    try {
        // 重要：等待加密完成
        //console.log('开始加密密码...');
        const encryptedPassword = await rsa(password);
        //console.log('加密完成:', encryptedPassword);
        
        // 发送请求
        const response = await fetch(window.apiUrls.java_url+"/login", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `username=${encodeURIComponent(username)}&enpassword=${encodeURIComponent(encryptedPassword)}`
        });
        
        const result = await response.json();
        console.log('登录响应:', result);
        
        if (result.success) {
            console.log("登录成功");
            if (result.token) {
                localStorage.setItem('token', result.token);
            }
            //alert('登录成功！');
            window.location.href = 'navigation.html';
        } else {
            if(result.message=="用户名或密码错误"){
                document.getElementById('password-error-msg').style.display = 'block';
                console.log(result.message || "登录失败");
            }
            else{
                alert("登录失败，发生未知错误");
                console.log(result.message || "登录失败");
            }
        }
    } catch (error) {
        console.error('登录错误:', error);
        alert('登录失败: ' + error.message);
    }
}