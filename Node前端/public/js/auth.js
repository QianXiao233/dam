async function yanzheng(){
    const token=localStorage.getItem('token');
    if(!token){
        alert("未登录，请先登录!");
        window.location.href='/index.html';
        return;
    }
    const result=await valibate_token(token);
        const username=result.username;
        const level=result.level;
        //alert("测试，验证通过!");
        return {username:username,level:level};
    
}
async function valibate_token(token){
    const response = await fetch(window.apiUrls.java_url+"/validate", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `token=${encodeURIComponent(token)}`
        });
        
        const result = await response.json();
        if(result.success){
            return result;
        }
        else{
        alert("凭证过期,请重新登录！");
        localStorage.removeItem('token');
        window.location.href('/index.html');
        }
}