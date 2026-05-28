const c = require('crypto');
const h = require('http');
const q = require('querystring');
h.get('http://127.0.0.1:8085/api/get_rsa', (r) => {
  let d = '';
  r.on('data', (x) => { d += x; });
  r.on('end', () => {
    const b = d.trim();
    const pem = '-----BEGIN PUBLIC KEY-----\n' + b.match(/.{1,64}/g).join('\n') + '\n-----END PUBLIC KEY-----';
    const enc = c.publicEncrypt({ key: pem, padding: c.constants.RSA_PKCS1_PADDING }, Buffer.from('123456')).toString('base64');
    const bod = q.stringify({ username: 'Admin', enpassword: enc });
    const lr = h.request({ hostname: '127.0.0.1', port: 8085, path: '/api/login', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(bod) } }, (lr2) => {
      let ld = '';
      lr2.on('data', (x) => { ld += x; });
      lr2.on('end', () => {
        const tk = JSON.parse(ld).token;
        console.log('TOKEN:', tk ? 'OK' : 'FAIL');
        if (!tk) return;
        // ADD DAM
        const ad = q.stringify({ dam_name: '测试大坝', dam_type: '土石坝', river_name: '黄河', design_water_level: '100.00', flood_water_level: '120.00', dam_height: '50.00', status: '1' });
        const dr = h.request({ hostname: '127.0.0.1', port: 8085, path: '/api/manage/dam/add', method: 'POST',
          headers: { 'Authorization': 'Bearer ' + tk, 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(ad) } }, (dr2) => {
          let dd = '';
          dr2.on('data', (x) => { dd += x; });
          dr2.on('end', () => { console.log('ADD DAM:', dd); });
        });
        dr.write(ad);
        dr.end();
        // LIST DAMS
        setTimeout(() => {
          h.get({ hostname: '127.0.0.1', port: 8085, path: '/api/manage/dam/list', headers: { 'Authorization': 'Bearer ' + tk } }, (lr3) => {
            let ld2 = '';
            lr3.on('data', (x) => { ld2 += x; });
            lr3.on('end', () => { console.log('LIST DAMS:', ld2); });
          });
        }, 500);
      });
    });
    lr.write(bod);
    lr.end();
  });
});
