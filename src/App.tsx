import React, { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [isOnline, setIsOnline] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  // 현재 IP 주소 가져오기
  const fetchCurrentIP = async () => {
    try {
      const response = await fetch("https://api64.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.log("IP 주소를 가져오는 중 오류 발생:", error);
      return null;
    }
  };

  // 네트워크 변경 감지 및 처리
  useEffect(() => {
    const handleNetworkChange = async () => {
      const ip = await fetchCurrentIP();
      const savedIP = "1.238.113.244";

      if (!ip) {
        setIsOnline(false);
        sendNotification(
          "❌ Wi-Fi 연결 끊김",
          `모빈에서 연결이 끊겼습니다. Flex에서 퇴근을 눌러주세요`
        );
        return;
      }

      if (savedIP) {
        if (ip !== savedIP) {
          if (isOnline) {
            setIsOnline(false);
            sendNotification(
              "❌ Wi-Fi 연결 끊김",
              `모빈에서 연결이 끊겼습니다. Flex에서 퇴근을 눌러주세요`
            );
          }
        } else {
          if (!isOnline) {
            setIsOnline(true);
            sendNotification(
              "✅ Wi-Fi 연결 됨",
              `모빈과 연결되었습니다. Flex에서 출근을 눌러주세요`
            );
          }
        }
      }
    };

    handleNetworkChange(); // 초기 호출

    window.addEventListener("online", handleNetworkChange);
    window.addEventListener("offline", handleNetworkChange);

    return () => {
      window.removeEventListener("online", handleNetworkChange);
      window.removeEventListener("offline", handleNetworkChange);
    };
  }, [isOnline]);

  // PWA 설치 유도
  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    const handleAppInstalled = () => {
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

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === "accepted") {
          console.log("✅ PWA 설치 성공");
        } else {
          console.log("❌ PWA 설치 취소");
        }
        setDeferredPrompt(null);
      });
    }
  };

  const requestNotificationPermission = () => {
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

  const sendNotification = (title: string, body: string) => {
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
