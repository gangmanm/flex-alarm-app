import React, { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wifiName, setWifiName] = useState<string | null>(
    localStorage.getItem("wifiName")
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      sendNotification(
        "✅ Wi-Fi 연결됨",
        `${wifiName || "알 수 없음"}에 연결되었습니다.`
      );
    };

    const handleOffline = () => {
      setIsOnline(false);
      const storedWifiName = localStorage.getItem("wifiName") || "알 수 없음";
      sendNotification(
        "❌ Wi-Fi 연결 끊김",
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
        <h1>{isOnline ? "✅ 온라인 상태" : "❌ 오프라인 상태"}</h1>
        {wifiName && <p>현재 저장된 Wi-Fi: {wifiName}</p>}
        <button onClick={requestNotificationPermission}>
          🔔 알림 권한 요청
        </button>
        <button onClick={saveWifiName}>📶 현재 Wi-Fi 저장</button>
      </header>
    </div>
  );
}

export default App;
