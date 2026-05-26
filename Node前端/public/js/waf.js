/**
 * 智御安澜 WAF 防火墙管理前端
 * 处理设备列表、规则 CRUD、统计、模式切换
 */

const API_BASE = '/api/waf';

// ======================== 工具函数 ========================

function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function formatTime(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function relativeTime(isoStr) {
  if (!isoStr) return '-';
  const diff = Date.now() - new Date(isoStr).getTime();
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
  return Math.floor(diff / 86400000) + '天前';
}

// ======================== API 调用 ========================

async function apiGet(path) {
  const res = await fetch(API_BASE + path);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || '请求失败');
  return data.data;
}

async function apiPost(path, body) {
  const res = await fetch(API_BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || '操作失败');
  return data.data;
}

async function apiDelete(path) {
  const res = await fetch(API_BASE + path, { method: 'DELETE' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || '删除失败');
  return true;
}

async function apiPut(path, body) {
  const res = await fetch(API_BASE + path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || '操作失败');
  return data.data;
}

// ======================== 统计信息 ========================

async function loadStats() {
  try {
    const stats = await apiGet('/stats');
    document.getElementById('statTotal').textContent = stats.totalRequests || 0;
    document.getElementById('statAllowed').textContent = stats.allowedRequests || 0;
    document.getElementById('statBlocked').textContent = stats.blockedRequests || 0;
    document.getElementById('statDevices').textContent = stats.deviceCount || 0;
    document.getElementById('statRules').textContent = stats.ruleCount || 0;

    // 风控上报统计
    document.getElementById('statHookReports').textContent = stats.hookReportCount || 0;
    document.getElementById('statHookBanned').textContent = stats.hookBannedCount || 0;

    // 更新风控面板提示中的阈值
    const hintEl = document.getElementById('hookThresholdHint');
    if (hintEl && stats.hookThreshold) {
      hintEl.textContent = `同一 IP 触发 ${stats.hookThreshold} 次后自动拉黑`;
    }

    // 模式
    const isWhitelist = stats.mode === 'whitelist';
    document.getElementById('modeLabel').textContent = isWhitelist ? '白名单模式' : '黑名单模式';
    document.getElementById('modeToggle').classList.toggle('active', isWhitelist);

    // WAF 状态
    document.getElementById('statusText').textContent = '运行中';
    document.getElementById('statusDot').className = 'status-dot online';
  } catch (err) {
    document.getElementById('statusText').textContent = '连接失败';
    document.getElementById('statusDot').className = 'status-dot offline';
    console.error('[WAF] 加载统计失败:', err);
  }
}

// ======================== 规则管理 ========================

function renderRules(rules) {
  const tbody = document.getElementById('rulesTableBody');
  if (!rules || rules.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="icon">📋</div>暂无规则，点击上方按钮添加</div></td></tr>`;
    return;
  }

  tbody.innerHTML = rules.map(rule => `
    <tr>
      <td>
        <span class="tag ${rule.type === 'allow' ? 'tag-allow' : 'tag-block'}">
          ${rule.type === 'allow' ? '✅ 放行' : '🚫 拦截'}
        </span>
      </td>

      <td style="font-family:monospace;font-size:13px;">${rule.value}</td>
      <td style="color:var(--text-secondary);font-size:12px;">${rule.comment || '-'}</td>
      <td style="text-align:center;">${rule.hitCount || 0}</td>
      <td style="font-size:12px;color:var(--text-secondary);">${formatTime(rule.createdAt)}</td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="deleteRule('${rule.id}')">删除</button>
      </td>
    </tr>
  `).join('');
}

async function loadRules() {
  try {
    const rules = await apiGet('/rules');
    renderRules(rules);
  } catch (err) {
    console.error('[WAF] 加载规则失败:', err);
    showToast('加载规则失败', 'error');
  }
}

async function addRule() {
  const type = document.getElementById('ruleType').value;
  const target = document.getElementById('ruleTarget').value;
  const value = document.getElementById('ruleValue').value.trim();
  const comment = document.getElementById('ruleComment').value.trim();

  if (!value) {
    showToast('请输入 IP 地址', 'error');
    return;
  }

  try {
    await apiPost('/rules', { type, target, value, comment });
    showToast('规则添加成功', 'success');
    closeAddRuleModal();
    loadRules();
    loadStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteRule(id) {
  if (!confirm('确定删除这条规则？')) return;
  try {
    await apiDelete('/rules/' + encodeURIComponent(id));
    showToast('规则已删除', 'success');
    loadRules();
    loadStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ======================== 设备列表 ========================

function renderDevices(devices) {
  const tbody = document.getElementById('devicesTableBody');
  if (!devices || devices.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="icon">💻</div>暂无设备数据</div></td></tr>`;
    return;
  }

  tbody.innerHTML = devices.map(dev => `
    <tr>
      <td>
        <strong style="font-family:monospace;cursor:pointer;color:var(--accent-cyan);"
            onclick="quickBlockIP('${dev.ip}')" title="点击添加到黑名单">${dev.ip}</strong>
      </td>
      <td>
        <span class="tag ${dev.online ? 'tag-online' : 'tag-offline'}">
          ${dev.online ? '在线' : '离线'}
        </span>
        ${dev.blocked ? '<span class="tag tag-block" style="margin-left:4px;">已拦截</span>' : ''}
      </td>
      <td style="text-align:center;">${dev.requestCount || 0}</td>
      <td style="font-size:12px;color:var(--text-secondary);" title="${dev.lastSeen}">
        ${relativeTime(dev.lastSeen)}
      </td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="quickBlockIP('${dev.ip}')" title="加入黑名单拦截">🚫 拦截</button>
        <button class="btn btn-success btn-sm" onclick="quickAllowIP('${dev.ip}')" title="加入白名单放行">✅ 放行</button>
      </td>
    </tr>
  `).join('');
}

async function loadDevices() {
  try {
    const devices = await apiGet('/devices');
    renderDevices(devices);
  } catch (err) {
    console.error('[WAF] 加载设备列表失败:', err);
  }
}

// 快速将 IP 加入黑名单
async function quickBlockIP(ip) {
  const comment = prompt(`将 ${ip} 加入黑名单，输入备注原因（可选）：`);
  if (comment === null) return;
  try {
    await apiPost('/rules', { type: 'block', value: ip, comment: comment || '手动拦截' });
    showToast(`已拦截 ${ip}`, 'success');
    loadRules();
    loadStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// 快速将 IP 加入白名单
async function quickAllowIP(ip) {
  const comment = prompt(`将 ${ip} 加入白名单，输入备注原因（可选）：`);
  if (comment === null) return;
  try {
    await apiPost('/rules', { type: 'allow', value: ip, comment: comment || '手动放行' });
    showToast(`已放行 ${ip}`, 'success');
    loadRules();
    loadStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// 解封 IP：删除黑名单规则 + 重置风控记录
async function unbanIP(ip) {
  if (!confirm(`确定解封 ${ip}？将删除该 IP 的黑名单规则并重置风控上报记录。`)) return;
  try {
    const result = await apiPost('/unban', { ip });
    showToast(`已解封 ${ip}（删除了 ${result.rulesRemoved} 条规则）`, 'success');
    loadRules();
    loadStats();
    loadHookReports();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ======================== 风控上报记录 ========================

function renderHookReports(reports) {
  const tbody = document.getElementById('hookReportsBody');
  if (!reports || reports.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="icon">🚨</div>暂无风控上报记录</div></td></tr>`;
    return;
  }

  tbody.innerHTML = reports.map(r => `
    <tr>
      <td><strong style="font-family:monospace;">${r.ip}</strong></td>
      <td style="text-align:center;">
        <span class="tag ${r.count >= 3 ? 'tag-block' : r.count >= 2 ? 'tag-offline' : ''}">${r.count}</span>
      </td>
      <td style="text-align:center;">${r.banned ? '3' : '—'}</td>
      <td>
        ${r.banned
          ? '<span class="tag tag-block">🚫 已拉黑</span>'
          : '<span class="tag tag-online">监控中</span>'}
      </td>
      <td style="font-size:12px;color:var(--text-secondary);">${formatTime(r.firstReported)}</td>
      <td style="font-size:12px;color:var(--text-secondary);">${formatTime(r.lastReported)}</td>
      <td>
        ${r.banned
          ? `<button class="btn btn-success btn-sm" onclick="unbanIP('${r.ip}')">🔓 解封</button>`
          : ''}
      </td>
    </tr>
  `).join('');
}

async function loadHookReports() {
  try {
    const reports = await apiGet('/hook-reports');
    renderHookReports(reports);
  } catch (err) {
    console.error('[WAF] 加载风控上报记录失败:', err);
  }
}

// ======================== 模式切换 ========================

async function toggleMode() {
  const isActive = document.getElementById('modeToggle').classList.contains('active');
  const newMode = isActive ? 'blacklist' : 'whitelist';
  try {
    await apiPut('/mode', { mode: newMode });
    showToast(`已切换为 ${newMode === 'whitelist' ? '白名单' : '黑名单'} 模式`, 'info');
    loadStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ======================== 网络扫描 ========================

async function scanNetwork() {
  const btn = window.event?.target || document.querySelector('.panel .actions .btn:first-child');
  if (btn) {
    btn.textContent = '⏳ 扫描中...';
    btn.disabled = true;
  }
  try {
    const result = await apiPost('/scan', {});
    showToast(`扫描完成，发现 ${result.arpEntries} 个 ARP 条目`, 'info');
    loadDevices();
    loadStats();
  } catch (err) {
    showToast('扫描失败: ' + err.message, 'error');
  }
  if (btn) {
    btn.textContent = '📡 扫描网络';
    btn.disabled = false;
  }
}

// ======================== 弹窗控制 ========================

function showAddRuleModal() {
  document.getElementById('addRuleModal').classList.add('active');
  document.getElementById('ruleValue').value = '';
  document.getElementById('ruleComment').value = '';
  document.getElementById('ruleValue').focus();
}

function closeAddRuleModal() {
  document.getElementById('addRuleModal').classList.remove('active');
}



// 点击弹窗外部关闭
document.addEventListener('click', function(e) {
  const modal = document.getElementById('addRuleModal');
  if (e.target === modal) closeAddRuleModal();
});

// 按 ESC 关闭弹窗
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeAddRuleModal();
});

// ======================== 刷新全部 ========================

async function refreshAll() {
  await Promise.all([loadStats(), loadRules(), loadDevices(), loadHookReports()]);
  showToast('已刷新', 'info');
}

// ======================== 定时刷新 ========================

// 每 5 秒刷新统计、设备列表和风控记录
setInterval(() => {
  loadStats();
  loadDevices();
  loadHookReports();
}, 5000);

// ======================== 初始化 ========================

document.addEventListener('DOMContentLoaded', () => {
  refreshAll();
  console.log('[WAF] 🛡️ 管理页面已加载');
});
