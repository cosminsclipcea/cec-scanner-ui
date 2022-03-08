import axios, { AxiosInstance, AxiosResponse } from "axios";

import { API_URL, API_USERNAME, API_PASSWORD } from "./constants";

export interface IScannerAPISystemInfoDeviceData {
  ApiVersionString: string;
  DeviceBarcodeFirmwareRevisionInfo: string;
  DeviceFirmwareDate: string;
  DeviceFirmwareTime: string;
  DeviceFirmwareVersionMajor: number;
  DeviceFirmwareVersionMinor: number;
  DeviceFirmwareVersionString: string;
  DeviceIlluminationGeneration: number;
  DeviceIlluminationGenerationVerbose: string;
  DeviceIlluminationRevision: number;
  DeviceIlluminationRevisionVerbose: string;
  DeviceIlluminationVariant: number;
  DeviceIlluminationVariantVerbose: string;
  DevicePcbRevision: string;
  DevicePid: number;
  DeviceProductionId: string;
  DeviceSerialNumber: string;
  DeviceSupportBarcode: number;
  DeviceSupportBatteryChargeLevel: number;
  DeviceSupportColor: number;
  DeviceSupportExternalBuzzer: number;
  DeviceSupportExternalStatusLed: number;
  DeviceSupportGlareReduction: number;
  DeviceSupportGraphicalDisplay: number;
  DeviceSupportMsr: number;
  DeviceSupportRealTimeClock: number;
  DeviceSupportTextDisplay: number;
  DeviceSupportUvLight: number;
  DeviceVid: number;
  DllCompileDate: string;
  DllCompileTime: string;
  DllVersionString: string;
}
export interface IScannerAPISystemInfo {
  Connected: boolean;
  DeskoWebApiVersion: string;
  DeviceData: IScannerAPISystemInfoDeviceData;
  Plugged: boolean;
  Server: string;
}
export interface IScannerAPIScanExecuteInfo {
  resourceList: string[];
}
export interface IScannerAPIScanExecuteImageResult {
  available: boolean;
  img?: string;
}
export interface IScannerAPIScanExecuteResult {
  resource: string;
  result: IScannerAPIScanExecuteImageResult;
}
export interface IScannerAPIReservation {
  reservationid: string;
}
export interface IScannerAPICredentials {
  username: string;
  password: string;
}

export class ScannerAPI {
  private client: AxiosInstance;
  private apiUrl: string = API_URL;
  private credentials: IScannerAPICredentials = {
    username: API_USERNAME,
    password: API_PASSWORD
  };
  private reservationid: string = "";
  private authorization: string = "";
  constructor() {
    this.client = axios.create({
      baseURL: this.apiUrl
    });
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
    this.client.defaults.baseURL = value;
    return this;
  }
  public setCredentials(username: string, password: string) {
    this.credentials.username = username;
    this.credentials.password = password;
    this.authorization = btoa(`${username}:${password}`);
    this.client.defaults.headers.common.Authorization = `Basic ${this.authorization}`;
    this.client.defaults.headers.common["Content-Type"] = "application/json";
    return this;
  }
  // services
  // connection/reservation
  public async createReservation(): Promise<IScannerAPIReservation> {
    const response: AxiosResponse<IScannerAPIReservation> = await this.client.post<
      IScannerAPIReservation
    >("/reservation", {
      timeout: 15
    });
    this.reservationid = response.data.reservationid;
    return response.data;
  }
  // reservation id must exist
  public async getSystemInfo(): Promise<IScannerAPISystemInfo> {
    const response: AxiosResponse<IScannerAPISystemInfo> = await this.client.get<
      IScannerAPISystemInfo
    >(`/system?reservationid=${this.reservationid}`);
    return response.data;
  }
  public async scanExecute(): Promise<IScannerAPIScanExecuteResult[]> {
    const response: AxiosResponse<IScannerAPIScanExecuteInfo> = await this.client.put<
      IScannerAPIScanExecuteInfo
    >(`/scan/execute?reservationid=${this.reservationid}`, {
      resolution: "high",
      ambientReduction: true,
      checkUvDullness: false,
      checkB900Ink: false,
      getMrz: false,
      MrzChecksumsCheck: false,
      MrzAgeCheck: false,
      MrzExpiryCheck: false,
      getDocumentShape: false,
      imageFormat: "image/jpeg",
      jpegQuality: 90,
      pngCompression: 1,
      optimizeImage: true,
      lightSources: {
        infrared: { use: true, croppings: ["document"] },
        visible: { use: true, croppings: ["document", "face"] },
        ultraviolet: { use: false, croppings: [] }
      }
    });
    const results = await Promise.all(
      response.data.resourceList.map(async (resource) => {
        const resourceResponse = await this.client.get<
          IScannerAPIScanExecuteImageResult
        >(`${resource}?reservationid=${this.reservationid}&timeout=25`);
        return resourceResponse.data;
      })
    );
    console.debug("Results of scan are", results);
    return response.data.resourceList.map((resource, index) => {
      return {
        resource,
        result: results[index]
      };
    });
  }
}
