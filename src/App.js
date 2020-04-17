import React, { useState, useEffect, useRef, useMemo } from "react";
// import OpenViduSession from "openvidu-react";
import { OpenVidu } from "openvidu-browser";

const UserVideoComponent = ({ streamManager }) => {
  const videoRef = useRef();

  useEffect(() => {
    streamManager.addVideoElement(videoRef.current);
  }, [videoRef, streamManager]);

  return <video autoPlay={true} ref={videoRef} />;
};

function App() {
  const [token, setToken] = useState(null);
  const [subscribers, setSubscribers] = useState([]);

  const session = useMemo(() => new OpenVidu().initSession(), []);

  useEffect(() => {
    const getToken = async () => {
      const response = await fetch(
        `http://${window.location.hostname}:4443/api/tokens`,
        {
          method: "POST",
          headers: {
            Authorization: "Basic " + btoa("OPENVIDUAPP:MY_SECRET"),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ session: "sm400", role: "SUBSCRIBER" }),
        }
      );
      const json = await response.json();
      setToken(json.token);
    };
    getToken();
  }, []);

  useEffect(() => {
    if (token) {
      console.log("token", token);
      const themSubscribers = [];
      session.on("streamCreated", (e) => {
        const subscriber = session.subscribe(e.stream, undefined);
        themSubscribers.push(subscriber);
        setSubscribers(themSubscribers);
      });
      session.processToken(token);
      const wsUri = session.openvidu.getWsUri();
      session.openvidu.wsUri = wsUri.replace("wss", "ws");
      session.options = {
        sessionId: session.sessionId,
        participantId: token,
        metadata: "",
      };
      session.connectAux(token);
    }
  }, [token]);

  const onJoinSession = (e) => {
    console.log("join session", e);
  };

  const onLeaveSession = (e) => {
    console.log("leave session", e);
  };

  const onError = (e) => {
    console.log("error", e);
  };

  if (!token) {
    return null;
  }

  return (
    <div>
      {subscribers.map((sub, i) => {
        return (
          <div key={`sub-${i}`}>
            <UserVideoComponent streamManager={sub} />
          </div>
        );
      })}
    </div>
  );
}

export default App;
