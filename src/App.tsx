import React, { useEffect, useState } from "react";
import "./App.css";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function App() {
  const [isOnline, setIsOnline] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [currentIP, setCurrentIP] = useState<string>("");
  const [hasNotified, setHasNotified] = useState<boolean>(false);
  const [prevIP, setPrevIP] = useState<string>("");

  // 현재 IP 주소 가져오기

  // 네트워크 변경 감지 및 처리
  useEffect(() => {
    const handleNetworkChange = async () => {
      const ip = await fetchCurrentIP();
      if (ip) {
        setCurrentIP(ip);
        setPrevIP(ip);
      }
      const savedIP = "1.238.113.244"; // 저장된 IP

      if (!ip) {
        setIsOnline(false);
        if (!hasNotified) {
          sendNotification(
            "❌ Wi-Fi 연결 끊김",
            `모빈에서 연결이 끊겼습니다. Flex에서 퇴근을 눌러주세요`
          );
          setHasNotified(true);
        }
        return;
      }

      if (ip !== savedIP && !hasNotified) {
        setIsOnline(false);
        sendNotification(
          "❌ Wi-Fi 연결 끊김",
          `모빈에서 연결이 끊겼습니다. Flex에서 퇴근을 눌러주세요`
        );
        setHasNotified(true);
        restartServiceWorker();
      } else if (ip === savedIP && !hasNotified) {
        setIsOnline(true);
        sendNotification(
          "✅ Wi-Fi 연결 됨",
          `모빈과 연결되었습니다. Flex에서 출근을 눌러주세요`
        );
        setHasNotified(true);
      }
    };

    const fetchCurrentIP = async (): Promise<string | null> => {
      try {
        const response = await fetch("https://api64.ipify.org?format=json");
        const data = await response.json();
        if (prevIP !== data.ip) {
          setHasNotified(false);
        }
        return data.ip;
      } catch (error) {
        console.log("IP 주소를 가져오는 중 오류 발생:", error);
        return null;
      }
    };
    const intervalId = setInterval(handleNetworkChange, 1000);

    return () => clearInterval(intervalId);
  }, [hasNotified, prevIP]);

  // 서비스 워커 재시작
  const restartServiceWorker = (): void => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          registration.unregister().then(() => {
            navigator.serviceWorker.register("/service-worker.js").then(() => {
              console.log("🔄 서비스 워커 재등록 완료");
            });
          });
        }
      });
    }
  };

  // PWA 설치 유도
  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = (): void => {
      console.log("✅ PWA 설치 완료");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = (): void => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("✅ PWA 설치 성공");
        } else {
          console.log("❌ PWA 설치 취소");
        }
        setDeferredPrompt(null);
      });
    }
  };

  const requestNotificationPermission = (): void => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          alert("알림 권한이 허용되었습니다.");
        } else {
          console.warn("알림 권한이 거부되었습니다.");
        }
      });
    }
  };

  const sendNotification = (title: string, body: string): void => {
    if (Notification.permission === "granted" && navigator.serviceWorker) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, { body });
      });
    } else {
      console.warn("알림 권한이 없거나 Service Worker가 준비되지 않았습니다.");
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>
          {isOnline ? "✅ 온라인 상태 : 출근" : "❌ 오프라인 상태 : 퇴근"}
        </h1>
        <h3>{"IP : " + currentIP}</h3>
        <p>
          사용방법
          <br />
          1. 홈 화면에 추가하기 버튼을 클릭하여 앱을 홈 화면에 추가
          <br />
          2. 알림 권한 요청 버튼을 눌러 알림 허용
          <br />
          3. 현재 Wi-Fi 저장 버튼을 눌러 모빈 Wi-Fi 저장
          <br />
          이제 모빈 Wi-Fi와의 연결이 해제되면 알림이 옵니다!
        </p>

        <button onClick={requestNotificationPermission}>
          🔔 알림 권한 요청
        </button>
        <button onClick={handleInstallClick}>🏠 홈 화면에 추가하기</button>
      </header>
    </div>
  );
}

export default App;
