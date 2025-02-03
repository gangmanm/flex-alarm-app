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
      const connectedWifi = prompt("현재 연결된 Wi-Fi 이름을 입력하세요:");
      if (connectedWifi) {
        setWifiName(connectedWifi);
        localStorage.setItem("wifiName", connectedWifi);
        sendNotification(
          "✅ Wi-Fi 연결됨",
          `${connectedWifi}에 연결되었습니다.`
        );
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      const storedWifiName = localStorage.getItem("wifiName");
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
  }, []);

  const requestNotificationPermission = () => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          alert("알림 권한이 허용되었습니다.");
        }
      });
    }
  };

  const sendNotification = (title: string, body: string) => {
    if (Notification.permission === "granted") {
      new Notification(title, { body });
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>{isOnline ? "✅ 온라인 상태" : "❌ 오프라인 상태"}</h1>
        {wifiName && <p>현재 저장된 Wi-Fi: {wifiName}</p>}
        <button onClick={requestNotificationPermission}>알림 권한 요청</button>
      </header>
    </div>
  );
}

export default App;
