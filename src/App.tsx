import {
  Button,
  ButtonGroup,
  InputGroup,
  Navbar,
  NavbarDivider,
  NavbarGroup,
  NavbarHeading
} from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { useCallback, useEffect, useState } from "react";
import "./App.css";

import { API_URL } from "./constants";

interface IScannerInfo {}
interface IScannerAPIReservation {
  reservationid: string;
}
interface IScannerAPICredentials {
  username: string;
  password: string;
}

class ScannerAPI {
  private apiUrl: string = "";
  private credentials: IScannerAPICredentials = { username: "", password: "" };
  private reservationid: string = "";
  private authorization: string = "";
  constructor() {
    ScannerAPI.instance = this;
  }
  private static instance: ScannerAPI;
  static getInstance() {
    if (!ScannerAPI.instance) {
      ScannerAPI.instance = new ScannerAPI();
    }
    return ScannerAPI.instance;
  }
  // helpers (di)
  public setApiUrl(value: string) {
    this.apiUrl = value;
    return this;
  }
  public setCredentials(username: string, password: string) {
    this.credentials.username = username;
    this.credentials.password = password;
    this.authorization = btoa(`${username}:${password}`);
    return this;
  }
  private getCommonHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Basic ${this.authorization}`
    };
  }
  // services
  public async getInfo(): Promise<IScannerInfo> {
    const response = await fetch(this.apiUrl, {
      method: ""
    });
    if (response.ok) {
      return response.body as IScannerInfo;
    }
    throw new Error("Scanner call error");
  }
  public async createReservation(): Promise<IScannerAPIReservation> {
    const serviceUrl = `${this.apiUrl}/reservation`;
    const response = await fetch(serviceUrl, {
      method: "POST",
      body: JSON.stringify({
        timeout: 15
      }),
      headers: this.getCommonHeaders()
    });
    if (response.ok) {
      const result = await response.json();
      this.reservationid = result.reservationid;
      return result as IScannerAPIReservation;
    }
    throw new Error("Scanner call error");
  }
  public async getSystemInfo() {
    const serviceUrl = `${this.apiUrl}/system?reservationid=${this.reservationid}`;
    const response = await fetch(serviceUrl, {
      method: "GET",
      headers: this.getCommonHeaders()
    });
    if (response.ok) {
      const result = await response.json();
      return result;
    }
    throw new Error("Scanner call error");
  }
}

export default function App() {
  const api = ScannerAPI.getInstance();
  const [username, setUsername] = useState("user");
  const [password, setPassword] = useState("passwd");
  const [connected, setConnected] = useState(false);
  const [apiUrl, setApiUrl] = useState(API_URL);
  const [systemInfo, setSystemInfo] = useState(null);

  const onUsernameChange = useCallback((e) => {
    setUsername(e.value);
  }, []);
  const onPasswordChange = useCallback((e) => {
    setPassword(e.value);
  }, []);

  const onApiUrlChange = useCallback(
    (e) => {
      api.setApiUrl(e.value);
      setApiUrl(e.value);
    },
    [api]
  );
  const onConnectClick = useCallback(
    async (e) => {
      try {
        const reservation = await api.createReservation();
        console.debug("Got reservation", reservation);
        setConnected(true);
      } catch (error) {
        console.error("Error while obtaining reservation", error);
        setConnected(false);
      }
    },
    [api]
  );
  const onSystemInfoClick = useCallback(async () => {
    try {
      const info = await api.getSystemInfo();
      console.debug("Got info", info);
      setSystemInfo(info);
    } catch (error) {
      console.error("Error while obtaining info", error);
    }
  }, [api]);
  useEffect(() => {
    api.setApiUrl(apiUrl).setCredentials(username, password);
  }, [api, apiUrl, username, password]);
  return (
    <div className="App">
      <div className="AppMain">
        <Navbar>
          <NavbarGroup>
            <NavbarHeading>Address</NavbarHeading>
            <InputGroup
              name="username"
              disabled={connected}
              value={username}
              onChange={onUsernameChange}
            />
            <InputGroup
              name="password"
              disabled={connected}
              value={password}
              onChange={onPasswordChange}
            />
            <InputGroup
              name="apiUrl"
              disabled={connected}
              value={apiUrl}
              onChange={onApiUrlChange}
              rightElement={
                <Button
                  icon={IconNames.DATA_CONNECTION}
                  onClick={onConnectClick}
                />
              }
            ></InputGroup>

            <NavbarDivider />
            <ButtonGroup>
              <Button disabled={!connected} onClick={onSystemInfoClick}>
                System info
              </Button>
            </ButtonGroup>
          </NavbarGroup>
        </Navbar>
      </div>
      <h1>Info</h1>
      <pre>{JSON.stringify(systemInfo, null, 2)}</pre>
    </div>
  );
}
