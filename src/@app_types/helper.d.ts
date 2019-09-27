import { BreezeEntity } from 'app/core';

// tslint:disable: interface-name
export type Instantiable<T> = new (...args: any[]) => T;

export interface IInstatiable {
  new (...args: any[]);
}

// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html
export type Unarray<T> = T extends Array<infer U> ? U : T;

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

declare var OData: any;

export interface IODataRequest {
  method: 'POST';
  requestUri: string;
  headers: {
    Accept: string;
    MaxDataServiceVersion: string;
    DataServiceVersion: string;
    'CONTENT-TYPE'?: string;
    'X-REQUESTDIGEST': string;
  };
  data?: IODataBatchData;
}

export type HttpMethods = 'GET' | 'POST' | 'DELETE' | 'MERGE';

export interface IOdataaChangeSet {
  method: HttpMethods | string;
  requestUri: string;
  data: object;
  headers: {
    DataServiceVersion: string;
    'CONTENT-ID'?: number;
    Accept: string;
  };
}

export interface IODataBatchData {
  __batchRequests: Array<{
    __changeRequests: IOdataaChangeSet[];
  }>;
}

export interface IODataBatchResponse {
  body: string;
  data: { results: any[] };
  headers: { [index: string]: string };
  statusCode: number;
  statusText: string;
}

export interface IODataPayload {
  body: string;
  data: { __batchResponses: IODataBatchResponse[] };
  headers: Array<{ [index: string]: string }>;
  requestUri: string;
  statusCode: number;
  statusText: string;
}

export type PropsOfType<T, K> = {
  [P in keyof T]: T[P] extends K ? P : never;
}[keyof T];

export type PropsNotOfType<T, K> = {
  [P in keyof T]: T[P] extends K ? never : P;
}[keyof T];

/**
 * Alias for any type to better capture why
 * the any type was used.
 */
export type ToComplex = any;
export type DoNotCare = any;
export type FixLater = any;
export type CompatabilityFix = any;
// export type NonMethodMembers<T> = Pick<T, Exclude<keyof T, MethodMembers<T>>>;

// export type EntityChildrenKind<T extends BreezeEntity> = Extract<
//   { [P in keyof T]: T[P] extends Array<infer U> ? U : never }[keyof T],
//   BreezeEntity
// >;
