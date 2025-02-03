import React, { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wifiName, setWifiName] = useState<string | null>(
    localStorage.getItem("wifiName")
  );
  const [currentIP, setCurrentIP] = useState<string>("");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const fetchCurrentIP = async () => {
    try {
      const response = await fetch("https://api64.ipify.org?format=json");
      const data = await response.json();
      setCurrentIP(data.ip);
    } catch (error) {
      console.error("IP 주소를 가져오는 중 오류 발생:", error);
    }
  };
  useEffect(() => {
    fetchCurrentIP(); // 초기 IP 확인

    const handleNetworkChange = () => {
      fetchCurrentIP(); // 네트워크 변경 시 IP 확인
    };

    window.addEventListener("online", handleNetworkChange);
    window.addEventListener("offline", handleNetworkChange);

    return () => {
      window.removeEventListener("online", handleNetworkChange);
      window.removeEventListener("offline", handleNetworkChange);
    };
  }, []);

  useEffect(() => {
    const storedIP = localStorage.getItem("storedIP");

    if (wifiName && currentIP) {
      console.log("Stored IP:", storedIP);
      console.log("Current IP:", currentIP);

      if (storedIP && storedIP !== currentIP) {
        if (isOnline) {
          setIsOnline(false);
          sendNotification(
            "❌ Wi-Fi 연결 끊김",
            `${wifiName}에서 연결이 끊겼습니다. Flex에서 퇴근을 눌러주세요`
          );
        }
      } else if (storedIP === currentIP) {
        if (!isOnline) {
          setIsOnline(true);
          sendNotification(
            "✅ Wi-Fi 연결 됨",
            `${wifiName}과 연결되었습니다. Flex에서 출근을 눌러주세요`
          );
        }
      }
    }
  }, [currentIP, wifiName, isOnline]);

  // PWA 설치 가능 여부 감지
  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === "accepted") {
          console.log("✅ PWA 설치 완료");
        } else {
          console.log("❌ PWA 설치 취소");
        }
        setDeferredPrompt(null);
      });
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      sendNotification(
        "출근 하셨나요? Flex에서 출근을 눌러주세요",
        `${wifiName || "알 수 없음"}에 연결되었습니다.`
      );
    };

    const handleOffline = () => {
      setIsOnline(false);
      const storedWifiName = localStorage.getItem("wifiName") || "알 수 없음";
      sendNotification(
        "퇴근 하셨나요? Flex에서 퇴근을 눌러주세요",
        `${storedWifiName}에서 연결이 끊겼습니다.`
      );
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [wifiName]);

  const requestNotificationPermission = () => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          alert("알림 권한이 허용되었습니다.");
        }
      });
    }
  };

  const saveWifiName = () => {
    const enteredWifiName = prompt("현재 연결된 Wi-Fi 이름을 입력하세요:");
    if (enteredWifiName) {
      setWifiName(enteredWifiName);
      localStorage.setItem("wifiName", enteredWifiName);
      localStorage.setItem("storedIP", currentIP);

      sendNotification(
        "✅ Wi-Fi 저장됨",
        `${enteredWifiName}이 저장되었습니다.`
      );
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
        {wifiName && <h3>현재 저장된 Wi-Fi: {wifiName}</h3>}
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
        <button onClick={saveWifiName}>📶 현재 Wi-Fi 저장</button>
        <button onClick={handleInstallClick}>🏠 홈 화면에 추가하기</button>
      </header>
    </div>
  );
}

export default App;
