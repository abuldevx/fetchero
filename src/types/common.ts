export type IMessage = string | Record<string, any>;

export interface IExtensions {
  code?: string;
  message?: IMessage;
  [key: string]: any;
}

export interface IErrors {
  extensions: IExtensions;
  message?: IMessage;
  code?: string;
}

export interface FetcherResponse<T = any> {
  data: T | null;
  errors?: IErrors[];
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ProxyContext {
  base?: string;
  headers?: Record<string, string>;
}

export interface FetcheroOptions {
  baseUrl: string;
  headers?: Record<string, string>;
  interceptors?: {
    request?: (config: any) => Promise<any> | any;
    response?: <T = unknown>(response: any) => Promise<T> | T;
  };
}
