/**
 * 摄像头画面自动重连 —— 溺水监测系统
 *
 * 背景：摄像头画面为 MJPEG 长连接（img 加载 multipart 流）。
 *   ERR_CONNECTION_RESET 200 (OK) 这类"连接建立后被重置"的断流，
 *   浏览器不会触发 img 的 error 事件，仅靠事件监听无法感知断线。
 *
 * 方案：每 3 秒心跳强制刷新所有画面（时间戳重新请求）。
 *   - 正常画面：周期性刷新保持连接新鲜
 *   - 失败/断流画面：3 秒内自动恢复
 *   - error 事件仍保留：触发时立即刷新（不等心跳）
 *   - 页面隐藏时暂停心跳，回到页面立即刷新一次
 */
(function () {
  'use strict';

  var HEARTBEAT_INTERVAL = 3000; // 心跳/重连间隔 3 秒
  var imgs = [];
  var heartbeatTimer = null;

  function getBaseSrc(img) {
    // 缓存原始地址（去掉时间戳参数），刷新时只更新时间戳
    if (!img.dataset.baseSrc) {
      img.dataset.baseSrc = img.src.split('?')[0];
    }
    return img.dataset.baseSrc;
  }

  function refresh(img, isError) {
    if (!img) return;
    var base = getBaseSrc(img);
    // 加时间戳强制发起新请求，绕过浏览器对失败/挂起连接的处理
    img.src = base + (base.indexOf('?') === -1 ? '?' : '&') + 't=' + Date.now();
    if (isError) {
      console.warn('[摄像头] 画面加载失败，立即重连:', img.id || img.src);
    }
  }

  function refreshAll() {
    for (var i = 0; i < imgs.length; i++) {
      refresh(imgs[i], false);
    }
  }

  function startHeartbeat() {
    if (heartbeatTimer) return;
    heartbeatTimer = setInterval(refreshAll, HEARTBEAT_INTERVAL);
  }

  function stopHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }

  function init() {
    imgs = Array.prototype.slice.call(document.querySelectorAll('img[id*="video_feed"]'))
      .filter(function (img) { return img.id !== 'modalImage'; });

    imgs.forEach(function (img) {
      // error 事件：立即重连（不等心跳）
      img.addEventListener('error', function () {
        refresh(img, true);
      });
      // load 事件：加载成功，无需处理（心跳会保持新鲜）
      img.addEventListener('load', function () { /* 占位：保持连接语义清晰 */ });
    });

    // 初始化前就已失败的画面（error 事件发生在绑定之前）：立即刷新
    imgs.forEach(function (img) {
      if (img.complete && img.naturalWidth === 0) {
        refresh(img, true);
      }
    });

    // 每 3 秒心跳强制刷新（覆盖 200-reset 断流等无法感知的断线场景）
    startHeartbeat();

    // 页面隐藏时暂停心跳，回到页面立即刷新一次
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        stopHeartbeat();
      } else {
        refreshAll();
        startHeartbeat();
      }
    });

    console.log('[摄像头] 自动重连已启用（每' + (HEARTBEAT_INTERVAL / 1000) + '秒心跳刷新），覆盖 ' + imgs.length + ' 路画面');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
