(function() {
  'use strict';

  if (window.ConsultantWidgetLoaded) return;
  window.ConsultantWidgetLoaded = true;

  var CLOSE_STORAGE_KEY = 'consultantWidgetClosedUntil';
  var isOpen = false;
  var chat2deskStatus = 'idle';

  var styles = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @keyframes fab-bounce-in { 0% { opacity: 0; transform: scale(0.3); } 50% { transform: scale(1.05); } 70% { transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }
    @keyframes card-slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulse-ring { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(1.5); opacity: 0; } }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .cw-fab-button { position: fixed; bottom: 24px; right: 24px; z-index: 9998; width: 64px; height: 64px; border-radius: 50%; background-color: #00A8E8; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; animation: fab-bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
    .cw-fab-button:hover { transform: scale(1.1); }
    .cw-pulse-ring { position: absolute; inset: 0; border-radius: 50%; background-color: inherit; animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    .cw-fab-icon { width: 32px; height: 32px; color: white; position: relative; z-index: 10; }
    .cw-overlay { position: fixed; inset: 0; z-index: 9997; background-color: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px); }
    .cw-widget-card { position: fixed; z-index: 9999; bottom: 96px; right: 24px; width: calc(100% - 48px); max-width: 420px; background-color: #1A2332; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); overflow: hidden; border: 1px solid rgba(45, 63, 82, 0.5); animation: card-slide-up 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
    .cw-close-button { position: absolute; top: 16px; right: 16px; z-index: 10; padding: 8px; border-radius: 50%; background-color: rgba(45, 63, 82, 0.5); border: none; cursor: pointer; transition: all 0.2s; color: #A8B5C8; }
    .cw-close-button:hover { background-color: rgba(45, 63, 82, 1); color: white; }
    .cw-widget-content { padding: 20px 24px; }
    .cw-header-section { display: flex; gap: 16px; margin-bottom: 24px; align-items: flex-start; }
    .cw-avatar-container { position: relative; flex-shrink: 0; }
    .cw-avatar { width: 80px; height: 80px; border-radius: 50%; overflow: hidden; border: 2px solid #2D3F52; background-color: #2D3F52; }
    .cw-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .cw-status-indicator { position: absolute; bottom: 4px; right: 4px; width: 16px; height: 16px; border-radius: 50%; background-color: #25D366; border: 2px solid #1A2332; }
    .cw-header-text { flex: 1; padding-top: 4px; min-width: 0; }
    .cw-widget-title { font-size: 20px; font-weight: 600; color: white; margin-bottom: 4px; }
    .cw-widget-description { font-size: 14px; color: #A8B5C8; line-height: 1.5; }
    .cw-section-title { font-size: 14px; font-weight: 500; color: #A8B5C8; margin-bottom: 12px; }
    .cw-messengers-section { margin-bottom: 24px; }
    .cw-button-list { display: flex; flex-direction: column; gap: 8px; }
    .cw-messenger-button { width: 100%; display: flex; align-items: center; gap: 16px; padding: 12px 16px; border-radius: 12px; background-color: rgba(45, 63, 82, 0.3); border: 1px solid rgba(45, 63, 82, 0.5); text-decoration: none; cursor: pointer; transition: all 0.2s; }
    .cw-messenger-button:hover { background-color: rgba(45, 63, 82, 0.5); }
    .cw-messenger-button:disabled { opacity: 0.5; cursor: not-allowed; }
    .cw-messenger-icon { flex-shrink: 0; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); }
    .cw-icon-telegram { background-color: #0088CC; }
    .cw-icon-whatsapp { background-color: #25D366; }
    .cw-icon-chat { background-color: #00A8E8; }
    .cw-messenger-text-wrapper { flex: 1; min-width: 0; }
    .cw-messenger-text { font-size: 18px; font-weight: 500; color: white; transition: color 0.2s; }
    .cw-messenger-button:hover .cw-messenger-text.cw-telegram { color: #0088CC; }
    .cw-messenger-button:hover .cw-messenger-text.cw-whatsapp { color: #25D366; }
    .cw-messenger-button:hover .cw-messenger-text.cw-chat { color: #00A8E8; }
    .cw-chat-status { font-size: 12px; color: #6b7280; margin-top: 2px; }
    .cw-chat-status.cw-error { color: #ef4444; }
    .cw-phone-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .cw-phone-button { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 12px 16px; border-radius: 12px; background-color: #1F2E3F; border: 1px solid rgba(45, 63, 82, 0.5); text-decoration: none; text-align: center; transition: all 0.2s; }
    .cw-phone-button:hover { background-color: #2A3B50; border-color: #2D3F52; }
    .cw-phone-icon { width: 20px; height: 20px; color: #00A8E8; margin-bottom: 8px; transition: transform 0.2s; }
    .cw-phone-button:hover .cw-phone-icon { transform: scale(1.1); }
    .cw-phone-number { font-size: 16px; font-weight: 600; color: white; margin-bottom: 4px; }
    .cw-phone-label { font-size: 12px; color: #A8B5C8; }
    .cw-spinner { animation: spin 1s linear infinite; }
    #chat24-iframe-container, #chat24-button, [id^="chat24"] { display: none !important; visibility: hidden !important; }
    @media (max-width: 640px) {
      .cw-widget-content { padding: 16px 20px; }
      .cw-avatar { width: 64px; height: 64px; }
      .cw-widget-title { font-size: 18px; }
      .cw-messenger-button { padding: 12px; }
      .cw-messenger-icon { width: 40px; height: 40px; }
      .cw-messenger-text { font-size: 16px; }
      .cw-phone-number { font-size: 14px; }
    }
  `;

  function injectStyles() {
    var styleEl = document.createElement('style');
    styleEl.id = 'consultant-widget-styles';
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);
  }

  function checkClosedState() {
    var closedUntil = localStorage.getItem(CLOSE_STORAGE_KEY);
    if (closedUntil) {
      var closedTime = parseInt(closedUntil, 10);
      if (Date.now() < closedTime) return true;
      localStorage.removeItem(CLOSE_STORAGE_KEY);
    }
    return false;
  }

  function initChat2Desk() {
    chat2deskStatus = 'loading';
    updateWidget();

    window.chat24_token = "904b449f7d66ed0b9657aa6892433165";
    window.chat24_url = "https://livechatv2.chat2desk.com";
    window.chat24_socket_url = "wss://livechatv2.chat2desk.com/widget_ws_new";
    window.chat24_static_files_domain = "https://storage.chat2desk.com/";
    window.lang = "ru";

    var timeout = setTimeout(function() {
      if (chat2deskStatus === 'loading') {
        chat2deskStatus = 'error';
        updateWidget();
      }
    }, 30000);

    fetch(window.chat24_url + "/packs/manifest.json?nocache=" + new Date().getTime())
      .then(function(res) { return res.json(); })
      .then(function(data) {
        var chat24Script = document.createElement("script");
        chat24Script.type = "text/javascript";
        chat24Script.async = true;
        chat24Script.src = window.chat24_url + data["application.js"];
        
        chat24Script.onload = function() {
          clearTimeout(timeout);
          setTimeout(function() {
            hideChat2DeskWidget();
            chat2deskStatus = 'ready';
            updateWidget();
          }, 1000);
        };

        chat24Script.onerror = function() {
          clearTimeout(timeout);
          chat2deskStatus = 'error';
          updateWidget();
        };

        document.body.appendChild(chat24Script);
      })
      .catch(function() {
        clearTimeout(timeout);
        chat2deskStatus = 'error';
        updateWidget();
      });
  }

  function hideChat2DeskWidget() {
    var existingStyle = document.getElementById('chat2desk-hide-style');
    if (existingStyle) return;

    var style = document.createElement('style');
    style.id = 'chat2desk-hide-style';
    style.textContent = '#chat24-iframe-container, #chat24-button, [id^="chat24"] { display: none !important; visibility: hidden !important; }';
    document.head.appendChild(style);
  }

  function openChat2Desk() {
    if (chat2deskStatus === 'ready' && window.chat2desk && window.chat2desk.open) {
      var hideStyle = document.getElementById('chat2desk-hide-style');
      if (hideStyle) hideStyle.remove();
      window.chat2desk.open();
    }
  }

  function handleClose() {
    isOpen = false;
    var closedUntil = Date.now() + (24 * 60 * 60 * 1000);
    localStorage.setItem(CLOSE_STORAGE_KEY, closedUntil.toString());
    updateWidget();
  }

  function toggleOpen() {
    isOpen = !isOpen;
    updateWidget();
  }

  function updateWidget() {
    var container = document.getElementById('consultantWidget');
    if (!container) {
      container = document.createElement('div');
      container.id = 'consultantWidget';
      document.body.appendChild(container);
    }
    
    if (!isOpen) {
      container.innerHTML = '<button class="cw-fab-button" onclick="window.consultantWidgetToggle()" aria-label="Открыть виджет консультанта"><div class="cw-pulse-ring"></div><svg class="cw-fab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></button>';
    } else {
      var chatIconContent = chat2deskStatus === 'loading' 
        ? '<svg class="cw-spinner" style="width:24px;height:24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg>'
        : chat2deskStatus === 'error'
        ? '<svg style="width:24px;height:24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
        : '<svg style="width:24px;height:24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';

      var chatStatus = chat2deskStatus === 'loading'
        ? '<div class="cw-chat-status">Загрузка...</div>'
        : chat2deskStatus === 'error'
        ? '<div class="cw-chat-status cw-error">Ошибка подключения</div>'
        : '';

      container.innerHTML = '\
        <div class="cw-overlay" onclick="window.consultantWidgetClose()"></div>\
        <div class="cw-widget-card">\
          <button class="cw-close-button" onclick="window.consultantWidgetClose()" aria-label="Закрыть виджет">\
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\
              <line x1="18" y1="6" x2="6" y2="18"></line>\
              <line x1="6" y1="6" x2="18" y2="18"></line>\
            </svg>\
          </button>\
          <div class="cw-widget-content">\
            <div class="cw-header-section">\
              <div class="cw-avatar-container">\
                <div class="cw-avatar">\
                  <img src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/cf1c9248-ff3e-4acd-9da1-612b3ed743d8-consulto-promo-bubble-lovable-app/assets/images/consultant-avatar-b1necHKX-1.jpg" alt="Персональный консультант">\
                </div>\
                <div class="cw-status-indicator"></div>\
              </div>\
              <div class="cw-header-text">\
                <div class="cw-widget-title">Персональный консультант</div>\
                <div class="cw-widget-description">Отвечу на вопросы по оплате, доставке, обслуживанию техники и помогу выбрать подходящий товар</div>\
              </div>\
            </div>\
            <div class="cw-messengers-section">\
              <div class="cw-section-title">Выберите удобный способ общения</div>\
              <div class="cw-button-list">\
                <a href="https://t.me/+79995504322" target="_blank" rel="noopener noreferrer" class="cw-messenger-button">\
                  <div class="cw-messenger-icon cw-icon-telegram">\
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">\
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-2.05-1.23-2.12-1.29-.02-.02-.34-.44.84-1.53 1.12-1.02 2.2-2.15 2.5-2.58.06-.09-.07-.27-.26-.2-.79.28-3.08 1.69-4.87 2.68-.31.17-.67.24-1.03.22-.38-.02-1.1-.22-1.63-.38-.66-.2-1.18-.4-1.13-.85.02-.23.36-.45.98-.68 3.86-1.68 6.43-2.78 7.71-3.31 3.66-1.5 4.42-1.76 4.91-1.77.11 0 .35.03.51.16.14.11.18.26.2.37.02.13.02.26 0 .4z"/>\
                    </svg>\
                  </div>\
                  <span class="cw-messenger-text cw-telegram">Telegram</span>\
                </a>\
                <a href="https://wa.me/79995504322" target="_blank" rel="noopener noreferrer" class="cw-messenger-button">\
                  <div class="cw-messenger-icon cw-icon-whatsapp">\
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">\
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>\
                    </svg>\
                  </div>\
                  <span class="cw-messenger-text cw-whatsapp">WhatsApp</span>\
                </a>\
                <button class="cw-messenger-button" onclick="window.consultantWidgetOpenChat()" ' + (chat2deskStatus !== 'ready' ? 'disabled' : '') + '>\
                  <div class="cw-messenger-icon cw-icon-chat">' + chatIconContent + '</div>\
                  <div class="cw-messenger-text-wrapper">\
                    <span class="cw-messenger-text cw-chat">Онлайн чат</span>' + chatStatus + '\
                  </div>\
                </button>\
              </div>\
            </div>\
            <div class="cw-section-title">Позвоните нам</div>\
            <div class="cw-phone-grid">\
              <a href="tel:+79995504322" class="cw-phone-button">\
                <svg class="cw-phone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>\
                </svg>\
                <div class="cw-phone-number">+7 999 550-43-22</div>\
                <div class="cw-phone-label">Для заказов</div>\
              </a>\
              <a href="tel:+79995504322" class="cw-phone-button">\
                <svg class="cw-phone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>\
                </svg>\
                <div class="cw-phone-number">+7 999 550-43-22</div>\
                <div class="cw-phone-label">Поддержка</div>\
              </a>\
            </div>\
          </div>\
        </div>';
    }
  }

  window.consultantWidgetToggle = toggleOpen;
  window.consultantWidgetClose = handleClose;
  window.consultantWidgetOpenChat = openChat2Desk;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      injectStyles();
      if (!checkClosedState()) {
        updateWidget();
        initChat2Desk();
      }
    });
  } else {
    injectStyles();
    if (!checkClosedState()) {
      updateWidget();
      initChat2Desk();
    }
  }
})();
