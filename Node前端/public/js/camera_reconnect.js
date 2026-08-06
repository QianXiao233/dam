/**
 * 摄像头画面自动重连 —— 溺水监测系统
 *
 * 功能：
 *  - 监听所有摄像头画面（img[id*="video_feed"]）的加载状态
 *  - 画面请求失败（error）后，每 3 秒自动重连（带时间戳强制重新请求）
 *  - 画面恢复（load）后自动停止重连
 *  - 页面隐藏时暂停重连，回到页面立即重试一次
 */
(function () {
  'use strict';

  var RECONNECT_INTERVAL = 3000; // 重连间隔 3 秒

  function setupAutoReconnect(img) {
    if (!img || img.__cameraReconnect) return; // 避免重复绑定
    img.__cameraReconnect = true;

    var reconnectTimer = null;

    function getBaseSrc() {
      // 缓存原始地址（去掉时间戳参数），重连时只更新时间戳
      if (!img.dataset.baseSrc) {
        img.dataset.baseSrc = img.src.split('?')[0];
      }
      return img.dataset.baseSrc;
    }

    function stopReconnect() {
      if (reconnectTimer) {
        clearInterval(reconnectTimer);
        reconnectTimer = null;
      }
    }

    function startReconnect() {
      if (reconnectTimer) return; // 已有一个定时器，不重复
      reconnectTimer = setInterval(reconnect, RECONNECT_INTERVAL);
      console.warn('[摄像头] 画面加载失败，每' + (RECONNECT_INTERVAL / 1000) + '秒尝试重连:', img.id || img.src);
    }

    function reconnect() {
      if (!img) return;
      var base = getBaseSrc();
      // 加时间戳强制发起新请求，绕过浏览器对失败连接的处理
      img.src = base + (base.indexOf('?') === -1 ? '?' : '&') + 't=' + Date.now();
    }

    // 加载失败：启动每 3 秒重连
    img.addEventListener('error', function () {
      // 弹窗放大图（动态创建）不参与重连
      if (img.id === 'modalImage') return;
      startReconnect();
    });

    // 画面恢复：停止重连
    img.addEventListener('load', function () {
      if (reconnectTimer) {
        stopReconnect();
        console.log('[摄像头] 画面已恢复:', img.id || img.src);
      }
    });

    // 页面隐藏时暂停重连，避免后台无效请求；回到页面立即重试
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        stopReconnect();
      } else if (reconnectTimer) {
        reconnect();
      }
    });
  }

  // 页面加载完成后为所有摄像头画面绑定重连
  function init() {
    var imgs = document.querySelectorAll('img[id*="video_feed"]');
    for (var i = 0; i < imgs.length; i++) {
      setupAutoReconnect(imgs[i]);
    }
    console.log('[摄像头] 自动重连已启用，覆盖 ' + imgs.length + ' 路画面');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
