import {
  MappingContext,
  EntityQuery,
  DataService,
  HttpResponse,
  core,
  AjaxAdapter,
  HttpResponse as BreezeHttpResponse
} from 'breeze-client';
import * as utils from './dataservice-utils';
import { DsaConfig } from './breeze-angular-bridge';
import { IHttpResultsData } from './dataservice-utils';
import * as _l from 'lodash';
import { dataBound } from '@syncfusion/ej2-grids';

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

declare var OData: any;

export interface IODataBatchResponse {
  body: string;
  data: { results: any[] };
  headers: { [index: string]: string };
  statusCode: string;
  statusText: string;
}

export interface IODataPayload {
  body: string;
  data: { __batchResponses: IODataBatchResponse[] };
  headers: { [index: string]: string };
  requestUri: string;
  statusCode: string;
  statusText: string;
}

export class SpQueryDataService {
  name: string;
  relativeUrl: boolean | ((ds: DataService, url: string) => string);

  headers = {
    DataServiceVersion: '3.0',
    Accept: 'application/json;odata=minimalmetadata',
    'Content-Type': 'application/json;odata=verbose'
  };

  constructor(
    private ajaxImpl: AjaxAdapter,
    private requestDigest: string,
    private mc?: MappingContext[]
  ) {
    this.headers['X-RequestDigest'] = requestDigest;
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
      return {
        requestUri: this.getAbsoluteUrl(ctx),
        method: 'GET',
        headers: this.headers
      };
    });

    const response = (await new Promise((resolve, reject) => {
      OData.request(
        {
          headers: {
            DataServiceVersion: '3.0'
          },
          requestUri: mc[0].dataService.serviceName + '$batch',
          method: 'POST',
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

    if (typeof query === 'string') {
      const requestCfg: DsaConfig = {
        type: 'GET',
        url: mc.getUrl(),
        headers: ''
      };

      const response = ((await this.ajaxImpl.ajax(
        requestCfg
      )) as any) as BreezeHttpResponse;

      const resultsData: IHttpResultsData = {
        results: response.data as any,
        inlineCount: response.data.__count
          ? parseInt(response.data.__count, 10)
          : undefined,
        httpResponse: response
      };

      return [resultsData];
    }

    const odataResponse = (await new Promise((resolve, reject) => {
      OData.request(
        {
          headers: this.headers,
          requestUri: mc.getUrl(),
          method: 'GET'
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

  getAbsoluteUrl(mc: MappingContext) {
    const serviceName = mc.dataService.qualifyUrl('');
    let url = mc.getUrl();
    // only prefix with serviceName if not already on the url
    let base = core.stringStartsWith(url, serviceName) ? '' : serviceName;

    // If no protocol, turn base into an absolute URI
    if (window && serviceName.indexOf('//') < 0) {
      // no protocol; make it absolute
      base =
        window.location.protocol +
        '//' +
        window.location.host +
        (core.stringStartsWith(serviceName, '/') ? '' : '/') +
        base;
    }

    // Add query params if .withParameters was used
    const query = mc.query as EntityQuery;
    if (!core.isEmpty(query.parameters)) {
      const paramString = utils.toQueryString(query.parameters);
      const sep = url.indexOf('?') < 0 ? '?' : '&';
      url = url + sep + paramString;
    }

    return base + url;
  }

  getQueryUrl(mc: MappingContext): string {
    let url: string;
    if (this.relativeUrl === true) {
      url = mc.getUrl();
    } else if (core.isFunction(this.relativeUrl)) {
      url = (this.relativeUrl as any)(mc.dataService, mc.getUrl());
    } else {
      url = this.getAbsoluteUrl(mc);
    }
    return url;
  }

  getRoutePrefix(dataService: DataService) {
    // Get the routePrefix from a Web API OData service name.
    // The routePrefix is presumed to be the pathname within the dataService.serviceName
    // Examples of servicename -> routePrefix:
    //   'http://localhost:55802/odata/' -> 'odata/'
    //   'http://198.154.121.75/service/odata/' -> 'service/odata/'
    let parser: any;
    if (typeof document === 'object') {
      // browser
      parser = document.createElement('a');
      parser.href = dataService.serviceName;
    } else {
      // node
      // TODO: how to best handle this
      // assumes existence of node's url.parse method.
      // parser = url.parse(dataService.serviceName);
    }
    let prefix = parser.pathname;
    if (prefix[0] === '/') {
      prefix = prefix.substr(1);
    } // drop leading '/'  (all but IE)
    if (prefix.substr(-1) !== '/') {
      prefix += '/';
    } // ensure trailing '/'
    return prefix;
  }
}
