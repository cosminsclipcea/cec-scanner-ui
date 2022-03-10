import axios, { AxiosInstance, AxiosResponse } from "axios";

import {
  API_URL,
  API_USERNAME,
  API_PASSWORD,
  CONNECTION_TIMEOUT
} from "./constants";

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
  testResult?: string;
}
export interface IScannerAPIScanExecuteResult {
  resource: string;
  result: any;
  // result: IScannerAPIScanExecuteImageResult;
}
export interface IScannerAPIReservation {
  reservationid: string;
}
export interface IScannerAPICredentials {
  username: string;
  password: string;
}
export interface IUvDullness {
  available: boolean;
  document: string;
  face: string;
  mrz: string;
}

export interface IB900Check {
  available: boolean;
  testResult: string;
}

export interface IMrz {
  available: boolean;
  composite: string;
  compositeChecksum: number;
  documentCode: string;
  documentExpiryDate: number;
  documentExpiryDateChecksum: number;
  documentExpiryDateDay: number;
  documentExpiryDateMonth: number;
  documentExpiryDateYear: number;
  documentIssuer: string;
  documentNumber: string;
  documentNumberChecksum: number;
  documentNumberComposite: string;
  documentNumberCompositeChecksum: number;
  documentShape: string;
  documentType: string;
  hasBackside: string;
  holderBirthDate: number;
  holderBirthDateChecksum: number;
  holderBirthDateDay: number;
  holderBirthDateMonth: number;
  holderBirthDateYear: number;
  holderName: string;
  holderNamePrimary: string;
  holderNameSecondary: string;
  holderNationality: string;
  holderSex: string;
  line1: string;
  line2: string;
  mrz: string;
  optional: number;
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
      timeout: CONNECTION_TIMEOUT
    });
    this.reservationid = response.data.reservationid;
    return response.data;
  }
  // reservation id must exist
  public async getSystemInfo(): Promise<IScannerAPISystemInfo> {
    const response: AxiosResponse<IScannerAPISystemInfo> = await this.client.get<
      IScannerAPISystemInfo
    >(`/system?reservationid=${this.reservationid}`); //system
    return response.data;
  }

  // reservation id must exist
  public async getMrzDevice() {
    this.client.get(
      `/device-mrz?reservationid=${this.reservationid}&timeout=25`
    );
    //  return response.data;
  }

  public async scanExecute(): Promise<IScannerAPIScanExecuteResult[]> {
    const response: AxiosResponse<IScannerAPIScanExecuteInfo> = await this.client.put<
      IScannerAPIScanExecuteInfo
    >(`/scan/execute?reservationid=${this.reservationid}`, {
      resolution: "high",
      ambientReduction: true,
      checkUvDullness: true,
      checkB900Ink: true,
      getMrz: true,
      MrzChecksumsCheck: true,
      MrzAgeCheck: true,
      MrzExpiryCheck: true,
      getDocumentShape: false,
      imageFormat: "image/jpeg",
      jpegQuality: 90,
      pngCompression: 1,
      optimizeImage: true,
      lightSources: {
        infrared: { use: true, croppings: ["document"] },
        visible: { use: true, croppings: ["document", "face"] },
        ultraviolet: { use: true, croppings: ["document"] }
      }
    });
    const results = await Promise.all(
      response.data.resourceList.map(async (resource) => {
        const resourceResponse = await this.client.get(
          /*<
          IScannerAPIScanExecuteImageResult
        >*/ `${resource}?reservationid=${this.reservationid}&timeout=25`
        );
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
