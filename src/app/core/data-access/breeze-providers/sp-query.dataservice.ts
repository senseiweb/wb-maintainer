import {
  MappingContext,
  EntityQuery,
  DataService,
  HttpResponse,
  core,
  AjaxAdapter,
  HttpResponse as BreezeHttpResponse,
  AjaxConfig
} from "breeze-client";
import { DsaConfig } from "./breeze-angular-bridge";
import * as _l from "lodash";
import { IODataBatchResponse, IODataPayload } from "@app_types";
import { SpConfig } from "app/core/config/app-config";
import { CustomDataServiceUtils, IHttpResultsData } from "./data-service-utils";

declare var OData: any;

export interface IBzHttpResponse {
  config: any;
  data: any[];
  getHeaders: () => any;
  status: number;
  ngConfig: string;
  spConfig: any;
  statusText: string;
  error: any;
  response: any;
}

export class SpQueryDataService {
  name: string;
  private ajaxImpl: AjaxAdapter;
  relativeUrl: boolean | ((ds: DataService, url: string) => string);

  headers = {
    DataServiceVersion: "3.0",
    Accept: "application/json;odata=minimalmetadata",
    "Content-Type": "application/json;odata=verbose"
  };

  constructor(
    private utils: CustomDataServiceUtils,
    private mc?: MappingContext[]
  ) {
    this.ajaxImpl = utils.ajaxAdapter;
  }

  async executeQuery(
    mc: MappingContext[][]
  ): Promise<IHttpResultsData | IHttpResultsData[]> {
    const ctxs = _l.flatMap(mc, x => x);

    if (ctxs.length === 1) {
      return this.executeSingleQuery(ctxs[0]);
    }

    return this.executeBatchQuery(ctxs);
  }

  async executeBatchQuery(mc: MappingContext[]): Promise<IHttpResultsData[]> {
    const bRequests = mc.map(ctx => {
      const headers = {};
      Object.assign(headers, this.headers);
      const internalBatchUrl = this.utils
        .getAbsoluteUrl(ctx.dataService, ctx.getUrl())
        .replace(/.*\/\/[^\/]*/, SpConfig.cfgSharepointMainAppSite);
      return {
        requestUri: internalBatchUrl,
        method: "GET",
        headers
      };
    });

    const response = (await new Promise(async (resolve, reject) => {
      const ds = mc[0].entityManager.dataService;
      OData.request(
        {
          headers: {
            MaxDataServiceVersion: "3.0",
            DataServiceVersion: "3.0",
            "X-RequestDigest": await ds.getRequestDigest()
          },
          requestUri: ds.odataAppEndpoint,
          method: "POST",
          data: {
            __batchRequests: bRequests
          }
        },
        (
          batches: { __batchResponses: IODataBatchResponse[] },
          payload: IODataPayload
        ) => resolve({ batches, payload }),
        reject,
        OData.batchHandler
      );
    })) as {
      batches: { __batchResponses: IODataBatchResponse[] };
      payload: object;
    };

    const batchRepsonses = response.batches.__batchResponses.map(
      (batch: IODataBatchResponse): IHttpResultsData => {
        return {
          results: batch.data.results,
          inlineCount: undefined,
          httpResponse: response.payload
        };
      }
    );
    return batchRepsonses;
  }

  async executeSingleQuery(mc: MappingContext): Promise<IHttpResultsData[]> {
    const query = mc.query;

    const headers = this.headers;

    headers[
      "X-RequestDigest"
    ] = await mc.entityManager.dataService.getRequestDigest();

    if (typeof query === "string") {
      const requestCfg: AjaxConfig = {
        type: "GET",
        url: mc.getUrl(),
        success: undefined,
        error: undefined,
        headers
      };

      const response = (this.ajaxImpl.ajax(
        requestCfg
      ) as any) as BreezeHttpResponse;

      const resultsData: IHttpResultsData = {
        results: response.data as any,
        inlineCount: response.data.__count
          ? parseInt(response.data.__count, 10)
          : undefined,
        httpResponse: response
      };

      return [resultsData];
    }

    const odataResponse = (await new Promise(async (resolve, reject) => {
      OData.request(
        {
          headers,
          requestUri: mc.getUrl(),
          method: "GET"
        },
        (data, httpResponse) => resolve({ data, httpResponse }),
        reject
      );
    })) as any;

    const singleResponse: IHttpResultsData = {
      results: odataResponse.data.results,
      inlineCount: undefined,
      httpResponse: odataResponse.httpResponse
    };
    return [singleResponse];
  }
}
