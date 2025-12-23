"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2, MessageSquareText, Phone, X } from "lucide-react";

type ConsultantWidgetTheme = "dark" | "light";
type Chat2DeskStatus = "idle" | "loading" | "ready" | "error";

interface WindowWithChat2Desk extends Window {
  chat24_token?: string;
  chat24_url?: string;
  chat24_socket_url?: string;
  chat24_static_files_domain?: string;
  chat24_start_hidden?: boolean;
  lang?: string;
  chat2desk?: {
    open?: () => void;
  };
}

declare const window: WindowWithChat2Desk;

interface ConsultantWidgetProps {
  theme?: ConsultantWidgetTheme;
}

export default function ConsultantWidget({ theme = "dark" }: ConsultantWidgetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [chat2deskStatus, setChat2deskStatus] = useState<Chat2DeskStatus>("idle");
  const [openChatOnReady, setOpenChatOnReady] = useState(false);
  const [currentTheme] = useState<ConsultantWidgetTheme>(theme);

  useEffect(() => {
    if (typeof window === "undefined") return;

    hideChat2DeskWidget();

    let showTimeout: number | undefined;

    try {
      const closedUntil = localStorage.getItem("consultantWidgetClosedUntil");
      if (closedUntil) {
        const closedTime = parseInt(closedUntil, 10);
        if (Date.now() < closedTime) {
          return;
        } else {
          localStorage.removeItem("consultantWidgetClosedUntil");
        }
      }

      showTimeout = window.setTimeout(() => {
        setIsVisible(true);
      }, 3000);
    } catch (e) {
      console.warn("localStorage недоступен:", e);
      showTimeout = window.setTimeout(() => {
        setIsVisible(true);
      }, 3000);
    }

    return () => {
      if (showTimeout) window.clearTimeout(showTimeout);
    };
  }, []);

  const hideChat2DeskWidget = () => {
    if (typeof window === "undefined") return;

    if (document.getElementById("hide-chat2desk-widget")) return;

    const style = document.createElement("style");
    style.id = "hide-chat2desk-widget";
    style.textContent = `
      .startBtn,
      .startBtn__button,
      button.startBtn__button,
      [class*="startBtn"],
      #chat24-button,
      .chat24-widget-button,
      #chat24-widget-container .startBtn {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
        opacity: 0 !important;
        position: fixed !important;
        left: -9999px !important;
        top: -9999px !important;
        width: 0 !important;
        height: 0 !important;
        z-index: -1 !important;
      }

      body:not(.chat2desk-open) #chat24-iframe-container,
      body:not(.chat2desk-open) [id*="chat24"],
      body:not(.chat2desk-open) [class*="chat24"] {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
        opacity: 0 !important;
        position: fixed !important;
        left: -9999px !important;
        top: -9999px !important;
      }
    `;
    document.head.appendChild(style);

    const observer = new MutationObserver((mutations) => {
      const isChatOpen = document.body.classList.contains("chat2desk-open");

      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;

          const nodeClass = node.className?.toString() ?? "";
          const isStartBtn = node.id === "chat24-button" || nodeClass.includes("startBtn") || nodeClass.includes("chat24-widget-button");
          const isChat24 = node.id?.includes("chat24") || nodeClass.includes("chat24");

          if (isStartBtn || (!isChatOpen && isChat24)) {
            node.style.cssText = "display: none !important; visibility: hidden !important; pointer-events: none !important; opacity: 0 !important; width: 0 !important; height: 0 !important;";
          }

          if (!node.querySelector) return;

          const startButtons = node.querySelectorAll(
            ".startBtn, .startBtn__button, button.startBtn__button, [class*=\"startBtn\"], #chat24-button, .chat24-widget-button"
          );
          startButtons.forEach((el) => {
            (el as HTMLElement).style.cssText = "display: none !important; visibility: hidden !important; pointer-events: none !important; opacity: 0 !important; width: 0 !important; height: 0 !important;";
          });

          if (!isChatOpen) {
            const chat24Elements = node.querySelectorAll(
              "#chat24-iframe-container, [id*=\"chat24\"], [class*=\"chat24\"]"
            );
            chat24Elements.forEach((el) => {
              (el as HTMLElement).style.cssText = "display: none !important; visibility: hidden !important; pointer-events: none !important; opacity: 0 !important;";
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  };

  const initChat2Desk = () => {
    if (typeof window === "undefined") return;

    hideChat2DeskWidget();

    const IE_SUPPORT_SRC = "https://livechatv2.chat2desk.com/packs/ie-11-support.js";
    const APP_SCRIPT_ID = "chat2desk-application-js";

    if (document.getElementById(APP_SCRIPT_ID)) {
      setChat2deskStatus(window.chat2desk?.open ? "ready" : "loading");
      return;
    }

    setChat2deskStatus("loading");

    if (!document.querySelector(`script[src="${IE_SUPPORT_SRC}"]`)) {
      const ieSupport = document.createElement("script");
      ieSupport.src = IE_SUPPORT_SRC;
      ieSupport.async = true;
      document.body.appendChild(ieSupport);
    }

    const token = "904b449f7d66ed0b9657aa6892433165";
    window.chat24_token = token;
    window.chat24_url = "https://livechatv2.chat2desk.com";
    window.chat24_socket_url = "wss://livechatv2.chat2desk.com/widget_ws_new";
    window.chat24_static_files_domain = "https://storage.chat2desk.com/";
    window.chat24_start_hidden = true;
    window.lang = "ru";

    const timeout = setTimeout(() => {
      setChat2deskStatus("error");
    }, 30000);

    fetch(`${window.chat24_url}/packs/manifest.json?nocache=${new Date().getTime()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Не удалось загрузить manifest");
        return res.json();
      })
      .then((data) => {
        const chat24Script = document.createElement("script");
        chat24Script.id = APP_SCRIPT_ID;
        chat24Script.type = "text/javascript";
        chat24Script.async = true;
        chat24Script.src = `${window.chat24_url}${data["application.js"]}`;

        chat24Script.onload = () => {
          clearTimeout(timeout);
          setTimeout(() => {
            setChat2deskStatus("ready");
          }, 1000);
        };

        chat24Script.onerror = () => {
          clearTimeout(timeout);
          setChat2deskStatus("error");
        };

        document.body.appendChild(chat24Script);
      })
      .catch((error) => {
        console.error("Ошибка загрузки Chat2Desk:", error);
        clearTimeout(timeout);
        setChat2deskStatus("error");
      });
  };

  const openChat2Desk = () => {
    if (typeof window === "undefined") return;
    if (chat2deskStatus !== "ready") return;

    setIsOpen(false);
    document.body.classList.add("chat2desk-open");
    document.dispatchEvent(new CustomEvent("popups:open"));

    setTimeout(() => {
      window.chat2desk?.open?.();

      const startButton = document.querySelector<HTMLButtonElement>(
        ".startBtn__button, button.startBtn__button, .startBtn button, .startBtn, .chat24-widget-button"
      );
      startButton?.click();

      const chatContainer = document.getElementById("chat24-iframe-container");
      if (chatContainer) {
        chatContainer.style.cssText =
          "display: block !important; visibility: visible !important; pointer-events: auto !important; position: fixed !important; left: auto !important; top: auto !important; opacity: 1 !important;";
      }

      const chatButtons = document.querySelectorAll(
        '.startBtn, .startBtn__button, button.startBtn__button, [class*="startBtn__button"], #chat24-button, .chat24-widget-button'
      );
      chatButtons.forEach((btn) => {
        (btn as HTMLElement).style.cssText = "display: none !important; visibility: hidden !important; pointer-events: none !important; opacity: 0 !important;";
      });
    }, 150);
  };

  useEffect(() => {
    if (!openChatOnReady) return;

    if (chat2deskStatus === "ready") {
      openChat2Desk();
      setOpenChatOnReady(false);
    }

    if (chat2deskStatus === "error") {
      setOpenChatOnReady(false);
    }
  }, [chat2deskStatus, openChatOnReady]);

  const handleOnlineChatClick = () => {
    if (chat2deskStatus === "ready") {
      openChat2Desk();
      return;
    }

    if (chat2deskStatus === "loading") {
      setOpenChatOnReady(true);
      return;
    }

    setOpenChatOnReady(true);
    initChat2Desk();
  };

  const handleClose = () => {
    setIsOpen(false);
    try {
      const closedUntil = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem("consultantWidgetClosedUntil", closedUntil.toString());
    } catch (e) {
      console.warn("Не удалось сохранить в localStorage:", e);
    }
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  if (!isVisible) return null;

  const isDark = currentTheme === "dark";
  const bgColor = isDark ? "bg-[#1A2332]" : "bg-white";
  const textPrimary = isDark ? "text-white" : "text-[#1A2332]";
  const textSecondary = isDark ? "text-[#A8B5C8]" : "text-gray-600";
  const cardBg = isDark ? "bg-[#2D3F52]/30" : "bg-gray-50";
  const cardHover = isDark ? "hover:bg-[#2D3F52]/50" : "hover:bg-gray-100";
  const borderColor = isDark ? "border-[#2D3F52]/50" : "border-gray-200";
  const accentColor = isDark ? "#00A8E8" : "#10B981";

  return (
    <>
      <style jsx global>{`
        @keyframes fab-bounce-in {
          0% { opacity: 0; transform: scale(0.3); }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes card-slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .animate-fab-bounce-in {
          animation: fab-bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        }
        .animate-card-slide-up {
          animation: card-slide-up 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
        }
        .pulse-ring {
          animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      {!isOpen && (
        <button
          onClick={toggleOpen}
          className={`fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-2xl ${
            isDark ? "bg-[#00A8E8]" : "bg-[#10B981]"
          } hover:scale-110 transition-all duration-300 flex items-center justify-center group animate-fab-bounce-in p-0 overflow-hidden border-2 border-white`}
          aria-label="Открыть виджет консультанта"
        >
          <div className="absolute inset-0 rounded-full bg-white/20 pulse-ring" />
          <MessageSquareText className="w-8 h-8 text-white relative z-10" />
        </button>
      )}

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden="true"
          />

          <div
            className={`fixed z-50 bottom-24 right-6 w-[calc(100%-3rem)] max-w-[400px] sm:max-w-[420px] ${bgColor} rounded-2xl shadow-2xl overflow-hidden animate-card-slide-up border ${borderColor}`}
            role="dialog"
            aria-labelledby="widget-title"
          >
            <button
              onClick={handleClose}
              className={`absolute top-4 right-4 z-10 p-2 rounded-full ${
                isDark ? "bg-[#2D3F52]/50 hover:bg-[#2D3F52]" : "bg-gray-200 hover:bg-gray-300"
              } ${textSecondary} hover:${textPrimary} transition-all duration-200`}
              aria-label="Закрыть виджет"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="relative flex-shrink-0">
                  <div
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden ring-2 ${
                      isDark ? "ring-[#2D3F52]" : "ring-gray-300"
                    } ${isDark ? "bg-[#2D3F52]" : "bg-gray-200"}`}
                  >
                    <img
                      src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/cf1c9248-ff3e-4acd-9da1-612b3ed743d8-consulto-promo-bubble-lovable-app/assets/images/consultant-avatar-b1necHKX-1.jpg"
                      alt="Персональный консультант"
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div
                    className={`absolute bottom-1 right-1 w-4 h-4 rounded-full ${
                      isDark ? "bg-[#25D366]" : "bg-[#10B981]"
                    } border-2 ${isDark ? "border-[#1A2332]" : "border-white"}`}
                  />
                </div>

                <div className="flex-1 min-w-0 pt-1">
                  <h2 id="widget-title" className={`text-lg sm:text-xl font-semibold ${textPrimary} mb-1`}>
                    Персональный консультант
                  </h2>
                  <p className={`text-sm ${textSecondary} leading-relaxed`}>
                    Отвечу на вопросы по оплате, доставке, обслуживанию техники и помогу выбрать подходящий товар
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className={`text-sm font-medium ${textSecondary} mb-3`}>
                  Выберите удобный способ общения
                </h3>
                <div className="space-y-2">
                  <a
                    href="https://t.me/+79995504322"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group w-full flex items-center gap-4 p-3 sm:p-4 rounded-xl ${cardBg} ${cardHover} border ${borderColor} hover:border-[#0088CC]/30 transition-all duration-200`}
                  >
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#0088CC] flex items-center justify-center text-white shadow-lg">
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-2.05-1.23-2.12-1.29-.02-.02-.34-.44.84-1.53 1.12-1.02 2.2-2.15 2.5-2.58.06-.09-.07-.27-.26-.2-.79.28-3.08 1.69-4.87 2.68-.31.17-.67.24-1.03.22-.38-.02-1.1-.22-1.63-.38-.66-.2-1.18-.4-1.13-.85.02-.23.36-.45.98-.68 3.86-1.68 6.43-2.78 7.71-3.31 3.66-1.5 4.42-1.76 4.91-1.77.11 0 .35.03.51.16.14.11.18.26.2.37.02.13.02.26 0 .4z" />
                      </svg>
                    </div>
                    <span
                      className={`text-base sm:text-lg font-medium ${textPrimary} group-hover:text-[#0088CC] transition-colors`}
                    >
                      Telegram
                    </span>
                  </a>

                  <a
                    href="https://api.whatsapp.com/send/?phone=79995504322"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group w-full flex items-center gap-4 p-3 sm:p-4 rounded-xl ${cardBg} ${cardHover} border ${borderColor} hover:border-[#25D366]/30 transition-all duration-200`}
                  >
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-lg">
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.357-5.032c0-5.431 4.453-10.038 10.166-10.038 2.7 0 5.274 1.042 7.191 2.917 1.91 1.875 2.958 4.43 2.95 7.19a9.962 9.962 0 01-9.944 9.952c-.174.01-.347.009-.516-.002zm9.125-15.012c-2.457-2.39-5.727-3.705-9.141-3.705-7.073 0-12.829 5.753-12.829 12.824 0 2.219.567 4.382 1.642 6.257L0 23.518l4.331-1.129a12.784 12.784 0 006.126 1.57h.005c7.098 0 12.853-5.755 12.853-12.827 0-3.418-1.332-6.685-3.738-9.068z" />
                      </svg>
                    </div>
                    <span
                      className={`text-base sm:text-lg font-medium ${textPrimary} group-hover:text-[#25D366] transition-colors`}
                    >
                      WhatsApp
                    </span>
                  </a>

                  <button
                    onClick={handleOnlineChatClick}
                    disabled={chat2deskStatus === "loading"}
                    className={`group w-full flex items-center gap-4 p-3 sm:p-4 rounded-xl ${cardBg} ${cardHover} border ${borderColor} transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div
                      className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white shadow-lg"
                      style={{ backgroundColor: accentColor }}
                    >
                      {chat2deskStatus === "loading" && <Loader2 className="w-6 h-6 animate-spin" />}
                      {chat2deskStatus === "error" && <AlertCircle className="w-6 h-6" />}
                      {(chat2deskStatus === "ready" || chat2deskStatus === "idle") && (
                        <MessageSquareText className="w-6 h-6" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <span
                        className={`text-base sm:text-lg font-medium ${textPrimary} transition-colors block`}
                        style={{ color: chat2deskStatus === "ready" ? accentColor : undefined }}
                      >
                        Технопарк чат
                      </span>
                      {chat2deskStatus === "loading" && <span className="text-xs text-gray-500">Загрузка...</span>}
                      {chat2deskStatus === "error" && (
                        <span className="text-xs text-red-500">Ошибка подключения</span>
                      )}
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <h3 className={`text-sm font-medium ${textSecondary} mb-3`}>Мы всегда рады помочь по телефону</h3>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <a
                    href="tel:88006004322"
                    className={`group flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl ${
                      isDark ? "bg-[#1F2E3F] hover:bg-[#2A3B50]" : "bg-gray-100 hover:bg-gray-200"
                    } border ${borderColor} text-center transition-all duration-200`}
                  >
                    <Phone
                      className="w-5 h-5 mb-2 group-hover:scale-110 transition-transform"
                      style={{ color: accentColor }}
                    />
                    <span className={`text-sm sm:text-base font-semibold ${textPrimary} mb-1`}>8 800 600 43 22</span>
                    <span className={`text-xs ${textSecondary}`}>Оформить заказ</span>
                  </a>

                  <a
                    href="tel:+79684994322"
                    className={`group flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl ${
                      isDark ? "bg-[#1F2E3F] hover:bg-[#2A3B50]" : "bg-gray-100 hover:bg-gray-200"
                    } border ${borderColor} text-center transition-all duration-200`}
                  >
                    <Phone
                      className="w-5 h-5 mb-2 group-hover:scale-110 transition-transform"
                      style={{ color: accentColor }}
                    />
                    <span className={`text-sm sm:text-base font-semibold ${textPrimary} mb-1`}>+7 968 499 43 22</span>
                    <span className={`text-xs ${textSecondary}`}>Служба поддержки</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
