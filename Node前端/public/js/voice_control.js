/**
 * 语音控制模块 —— 智控大坝泄洪：全程语音开闸/关闸
 *
 * 功能：
 *  - 页面加载后自动开始麦克风监听并持续运行（Chrome/Edge）
 *  - 说"开闸" → 播报"请确认开闸" → 再说"确认/确定/开闸" 才真正开闸（二次确认）
 *  - 说"关闸/关闭水闸/停止泄洪" → 直接关闸（恢复安全状态）
 *  - 说"取消/不用/算了" → 取消待确认的开闸
 *  - 复用 ajax.js 的 window.turnOn()/turnOff()/updateUI() 发送控制请求
 *
 * 防自触发：识别到指令并开始 TTS 播报时先停止识别，
 *           播报完毕后再自动恢复监听，避免拾取到自己的播报语音。
 *
 * 兼容性：需要 Chrome / Edge（webkitSpeechRecognition）+ 麦克风权限。
 */
(function () {
  'use strict';

  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  // ======================== 配置 ========================
  var CONFIRM_TIMEOUT = 15000; // 二次确认超时（毫秒）

  var OPEN_KEYWORDS = ['开闸', '开闸泄洪', '打开水闸', '放水', '开闸放水'];
  var CLOSE_KEYWORDS = ['关闸', '关闭', '关闭水闸', '停止泄洪', '停止放水', '关掉'];
  var CONFIRM_KEYWORDS = ['确认', '确定', '执行', '开闸'];
  var CANCEL_KEYWORDS = ['取消', '不用', '算了', '不要'];

  // ======================== 状态 ========================
  var recognition = null;
  var state = 'idle'; // idle | listening | awaiting_confirm
  var speaking = false; // 是否正在 TTS 播报（播报期间暂停识别）
  var confirmTimer = null;

  // ======================== 工具函数 ========================

  // 计算两个短字符串的编辑距离（Levenshtein）
  function levenshtein(a, b) {
    var m = a.length, n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    var dp = [];
    for (var i = 0; i <= m; i++) dp[i] = [i];
    for (var j = 0; j <= n; j++) dp[0][j] = j;
    for (i = 1; i <= m; i++) {
      for (j = 1; j <= n; j++) {
        var cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      }
    }
    return dp[m][n];
  }

  // 单个关键词容错匹配：
  //  1) 直接包含
  //  2) 编辑距离容错：识别文本与关键词等长的子串，允许少量字差异（口音/识别误差）
  //     允许误差 = max(1, 关键词长度/2)，即 2 字词最多错 1 字，4-5 字词最多错 2 字
  //     且要求首字相同，避免"关闭闸门(闭闸)"被误判为"开闸"这类相反意图误触发
  function matchKeyword(text, keyword) {
    if (text.indexOf(keyword) !== -1) return true;
    var klen = keyword.length;
    if (klen < 2) return false;
    var maxDist = Math.max(1, Math.floor(klen / 2));
    // 滑动窗口：比较文本中与关键词等长的每个子串（首字必须相同才允许容错）
    for (var i = 0; i + klen <= text.length; i++) {
      var sub = text.substring(i, i + klen);
      if (sub.charAt(0) === keyword.charAt(0) && levenshtein(sub, keyword) <= maxDist) return true;
    }
    // 文本长度与关键词接近时，整串比较（同样要求首字相同）
    if (Math.abs(text.length - klen) <= maxDist && text.charAt(0) === keyword.charAt(0) && levenshtein(text, keyword) <= maxDist) return true;
    return false;
  }

  // 语音容错匹配：先去噪（去掉标点/语气词），再对每个关键词容错匹配
  function includesKeyword(text, keywords) {
    var cleaned = (text || '')
      .replace(/[，。！？、,.!?~\s]/g, '')
      .replace(/嗯|啊|哦|呃|呢|吧|呀|嘛|那个|这个|就是|请|帮我|一下|麻烦/g, '');
    for (var i = 0; i < keywords.length; i++) {
      if (matchKeyword(cleaned, keywords[i])) {
        return true;
      }
    }
    return false;
  }

  // 更新状态指示灯（若页面存在 #voiceStatus 元素）
  function setIndicator(text, cls) {
    var el = document.getElementById('voiceStatus');
    if (!el) return;
    el.textContent = text;
    el.className = 'voice-status ' + (cls || '');
  }

  function shouldListen() {
    return state === 'listening' || state === 'awaiting_confirm';
  }

  // ======================== TTS 播报（含防自触发） ========================
  var ttsInstance = null;
  function getTTS() {
    if (!ttsInstance && window.CrossPlatformTTS) {
      ttsInstance = new window.CrossPlatformTTS();
    }
    return ttsInstance;
  }

  function speak(text, onDone) {
    // 播报期间暂停识别，防止拾取到自己的播报语音
    speaking = true;
    if (recognition) {
      try { recognition.stop(); } catch (e) { /* 忽略 */ }
    }

    var finished = false;
    var finish = function () {
      if (finished) return;
      finished = true;
      speaking = false;
      // 播报完毕恢复监听（若状态仍是监听/待确认）
      if (recognition && shouldListen()) {
        try { recognition.start(); } catch (e) { /* 已在运行则忽略 */ }
      }
      if (onDone) onDone();
    };

    // 优先使用项目 TTS.js（CrossPlatformTTS，中文语音选择更优）
    var tts = getTTS();
    if (tts) {
      try {
        tts.speak(text).then(finish).catch(finish);
      } catch (e) {
        finish();
      }
    } else if (window.speechSynthesis) {
      // 兜底：原生语音合成
      var u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-CN';
      var voices = window.speechSynthesis.getVoices();
      for (var i = 0; i < voices.length; i++) {
        if (voices[i].lang && voices[i].lang.toLowerCase().indexOf('zh') === 0) {
          u.voice = voices[i];
          break;
        }
      }
      u.rate = 1;
      u.onend = finish;
      u.onerror = finish;
      window.speechSynthesis.speak(u);
    } else {
      finish();
    }

    // 兜底超时：即使播报异常也恢复监听（10 秒）
    setTimeout(function () {
      if (!finished) finish();
    }, 10000);
  }

  // ======================== 指令处理 ========================
  function handleCommand(text) {
    // ---- 待确认状态：等待"确认/取消" ----
    if (state === 'awaiting_confirm') {
      if (includesKeyword(text, CANCEL_KEYWORDS)) {
        cancelConfirm();
      } else if (includesKeyword(text, CONFIRM_KEYWORDS)) {
        executeOpen();
      } else {
        speak('请说确认或取消');
      }
      return;
    }

    // ---- 正常监听状态 ----
    if (includesKeyword(text, OPEN_KEYWORDS)) {
      if (window.isRelayOn === true) {
        speak('水闸已经是开启状态');
      } else {
        // 开闸需要二次确认
        state = 'awaiting_confirm';
        setIndicator('请确认开闸', 'warn');
        clearTimeout(confirmTimer);
        confirmTimer = setTimeout(cancelConfirm, CONFIRM_TIMEOUT);
        speak('请确认开闸');
      }
      return;
    }

    if (includesKeyword(text, CLOSE_KEYWORDS)) {
      if (window.isRelayOn === false) {
        speak('水闸已经是关闭状态');
      } else {
        executeClose();
      }
      return;
    }
  }

  // 取消待确认的开闸
  function cancelConfirm() {
    clearTimeout(confirmTimer);
    confirmTimer = null;
    state = 'listening';
    setIndicator('正在聆听…', 'on');
    speak('已取消开闸');
  }

  // 执行开闸（已获二次确认）
  function executeOpen() {
    clearTimeout(confirmTimer);
    confirmTimer = null;
    state = 'listening';
    setIndicator('正在聆听…', 'on');
    // 同步本地状态（与按钮 manualToggle 行为一致），否则界面不更新且后续"关闸"会被误判为"已是关闭状态"
    window.isRelayOn = true;
    if (typeof window.turnOn === 'function') {
      window.turnOn();
    }
    if (typeof window.updateUI === 'function') {
      window.updateUI();
    }
    speak('已开闸泄洪');
  }

  // 执行关闸（直接执行，无需确认）
  function executeClose() {
    state = 'listening';
    setIndicator('正在聆听…', 'on');
    // 同步本地状态
    window.isRelayOn = false;
    if (typeof window.turnOff === 'function') {
      window.turnOff();
    }
    if (typeof window.updateUI === 'function') {
      window.updateUI();
    }
    speak('水闸已关闭');
  }

  // ======================== 初始化与常驻监听 ========================
  function init() {
    if (!SpeechRecognition) {
      console.warn('[语音控制] 当前浏览器不支持语音识别，请使用 Chrome 或 Edge');
      setIndicator('不支持语音', 'off');
      return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.interimResults = false;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = function (event) {
      var text = '';
      for (var i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          text += event.results[i][0].transcript;
        }
      }
      text = (text || '').trim();
      if (!text) return;
      console.log('[语音控制] 识别到: ' + text);
      handleCommand(text);
    };

    recognition.onerror = function (event) {
      // network 错误：识别服务网络波动（国内访问 Google 识别服务常见），属正常现象，
      // 静默处理即可，recognition 会自动 onend 并续接监听
      if (event.error === 'network') {
        return;
      }
      console.warn('[语音控制] 识别错误: ' + event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        // 麦克风权限被拒绝，停止运行
        setIndicator('麦克风被拒绝', 'off');
      } 
      // 其他错误（no-speech 等）无需处理，onend 会自动重启
    };

    recognition.onend = function () {
      // Chrome 每次识别 5-10 秒会自动结束，这里负责自动续接（常驻监听）
      // 播报中（speaking）不重启，等播报完成由 speak() 的 finish 恢复
      if (!speaking && shouldListen()) {
        try { recognition.start(); } catch (e) { /* 忽略 */ }
      }
    };

    // 页面加载完成后自动开始
    state = 'listening';
    setIndicator('正在聆听…', 'on');
    try {
      recognition.start();
    } catch (e) {
      console.warn('[语音控制] 启动失败: ' + e.message);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
