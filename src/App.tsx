import {
  Button,
  ButtonGroup,
  ControlGroup,
  InputGroup,
  Navbar,
  NavbarDivider,
  NavbarGroup,
  NavbarHeading,
  Card,
  Elevation
} from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { Text } from "@blueprintjs/core";
import { useCallback, useEffect, useState } from "react";

// project imports
import "./App.css";
import {
  IScannerAPISystemInfo,
  IScannerAPIScanExecuteResult,
  ScannerAPI,
  IUvDullness,
  IB900Check,
  IMrz
} from "./Api.client";

import {
  API_URL,
  API_USERNAME,
  API_PASSWORD,
  CONNECTION_TIMEOUT
} from "./constants";

export default function App() {
  const api = ScannerAPI.getInstance();
  const [username, setUsername] = useState(API_USERNAME);
  const [password, setPassword] = useState(API_PASSWORD);
  const [connected, setConnected] = useState(false);
  const [apiUrl, setApiUrl] = useState(API_URL);
  const [systemInfo, setSystemInfo] = useState<IScannerAPISystemInfo | null>(
    null
  );
  const [scanResult, setScanResult] = useState<IScannerAPIScanExecuteResult[]>(
    []
  );

  const [expiryCheck, setExpiryCheck] = useState();
  const [checksums, setChecksums] = useState();
  const [ageCheck, setAgeCheck] = useState();
  const [uvCheck, setUvCheck] = useState<IUvDullness>();
  const [b900Check, setB900Check] = useState<IB900Check>();
  const [mrz, setMrz] = useState<IMrz>();
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
        setTimeout(() => {
          setConnected(false);
        }, CONNECTION_TIMEOUT * 1000);
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

  const onMrzDeviceClick = useCallback(async () => {
    try {
      /*const info = await*/ api.getMrzDevice();
      //  console.debug("Got info", info);
    } catch (error) {
      console.error("Error while mrz device", error);
    }
  }, [api]);

  const onScanClick = useCallback(async () => {
    setScanResult([]);
    try {
      const scan = await api.scanExecute();
      console.debug("Got scan", scan);
      scan.forEach(function (value) {
        var resource = value.resource.split("/");

        switch (resource[resource.length - 1]) {
          case "expiry-check": {
            setExpiryCheck(value.result["testResult"]);
            break;
          }
          case "checksums": {
            setChecksums(value.result["testResult"]);
            break;
          }
          case "age-check": {
            setAgeCheck(value.result["testResult"]);
            break;
          }
          case "uv-dullness": {
            setUvCheck(value.result);
            break;
          }
          case "b900-check": {
            setB900Check(value.result);
            break;
          }
          case "mrz": {
            setMrz(value.result);

            break;
          }
        }
      });
      setScanResult(scan);
    } catch (error) {
      console.error("Error while scanning", error);
    }
  }, [api]);

  // side effects
  useEffect(() => {
    api.setApiUrl(apiUrl).setCredentials(username, password);
  }, [api, apiUrl, username, password]);
  return (
    <div className="App">
      <div className="AppMain">
        <Navbar>
          <NavbarGroup>
            <NavbarHeading>Address</NavbarHeading>
            <ControlGroup>
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
              ></InputGroup>
              <Button
                icon={IconNames.DATA_CONNECTION}
                onClick={onConnectClick}
              />
            </ControlGroup>
            <NavbarDivider />
            <ButtonGroup>
              <Button disabled={!connected} onClick={onSystemInfoClick}>
                System info
              </Button>
              <Button disabled={!connected} onClick={onScanClick}>
                Scan
              </Button>
              <Button disabled={!connected} onClick={onMrzDeviceClick}>
                MRZ Device
              </Button>
            </ButtonGroup>
          </NavbarGroup>
        </Navbar>
      </div>

      <h1>Info</h1>

      {systemInfo && <pre>{JSON.stringify(systemInfo, null, 2)}</pre>}

      <Card interactive={true} elevation={Elevation.TWO}>
        <h5>Scan results</h5>
        <p>Expiry check: {expiryCheck}</p>
        <p>Checksums: {checksums}</p>
        <p>Age Check: {ageCheck}</p>
        <p>
          Uv Available: {String(uvCheck?.available)}, Document UV:
          {uvCheck?.document}, Face UV: {uvCheck?.face}, MRZ UV: {uvCheck?.mrz}
        </p>
        <p>B900 Check: {b900Check?.testResult}</p>
        <p>Mrz name: {mrz?.holderName}</p>
        <p>Mrz area: {mrz?.mrz}</p>
        <Button>Scan OK</Button>
        <Button>Scan NOT OK</Button>
      </Card>
    </div>
  );
}

/*{scanResult.map((it) => {
  const isImage = !!it.result.img;
  return (
    <div className="AppScanResult" key={it.resource}>
      <h5>{it.resource}</h5>
      {isImage ? (
        <img src={`data:image/jpeg;base64,${it.result.img}`} alt="" />
      ) : (
        "Not an image"
      )}
    </div>
  );
})} */
