import {
  HttpClient,
  HttpHeaders,
  HttpRequest,
  HttpEvent,
  HttpResponse,
  HttpErrorResponse
} from '@angular/common/http';
import {
  core,
  HttpResponse as BreezeHttpResponse,
  config,
  BaseAdapter
} from 'breeze-client';
import { last, map } from 'rxjs/operators';

export interface DsaConfig {
  url: string;
  type?: string;
  dataType?: string;
  contentType?: string | boolean;
  crossDomain?: string;
  headers?: {};
  data?: any;
  params?: {};
}

export class AjaxHttpClientAdapter implements BaseAdapter {
  static adapterName = 'angular';
  static adapterHttp: HttpClient;
  name = AjaxHttpClientAdapter.adapterName;
  defaultSettings = {};
  requestInterceptor: (info: {}) => {};

  constructor(private http: HttpClient) {
    this.http = AjaxHttpClientAdapter.adapterHttp;
  }

  static register(): void {
    config.registerAdapter('ajax', AjaxHttpClientAdapter);
    config.initializeAdapterInstance('ajax', 'angular', true);
  }

  initialize(http?: HttpClient) {
    this.http = http;
  }

  async ajax(ajaxConfig: DsaConfig): Promise<BreezeHttpResponse[]> {
    if (!this.http) {
      throw new Error('Unable to locate angular http module for ajax adapter');
    }

    // merge default DataSetAdapter Settings with config arg
    if (!core.isEmpty(this.defaultSettings)) {
      const compositeConfig = core.extend({}, this.defaultSettings);
      ajaxConfig = core.extend(compositeConfig, config) as DsaConfig;
      // extend is shallow; extend headers separately
      const reqHeaders = core.extend({}, (this.defaultSettings as any).headers); // copy default headers 1st
      ajaxConfig.headers = core.extend(reqHeaders, ajaxConfig.headers);
    }

    if (ajaxConfig.crossDomain) {
      throw new Error(
        this.name + ' does not support JSONP (jQuery.ajax:crossDomain) requests'
      );
    }

    let url = ajaxConfig.url;

    if (!core.isEmpty(ajaxConfig.params)) {
      // Hack: Not sure how Angular handles writing 'search' parameters to the url.
      // so this approach takes over the url param writing completely.
      const delim = url.indexOf('?') >= 0 ? '&' : '?';
      url = url + delim + encodeParams(ajaxConfig.params);
    }

    let headers = new HttpHeaders(ajaxConfig.headers || {});
    if (!headers.has('Content-Type')) {
      if (
        ajaxConfig.type != 'GET' &&
        ajaxConfig.type != 'DELETE' &&
        ajaxConfig.contentType !== false
      ) {
        headers = headers.set(
          'Content-Type',
          ajaxConfig.contentType || ('application/json; charset=utf-8' as any)
        );
      }
    }

    const body: any = ajaxConfig.data;
    const request = new HttpRequest(
      (ajaxConfig.type || 'GET').toUpperCase(),
      url,
      body,
      { headers, responseType: 'text' }
    );

    const requestInfo = {
      adapter: this, // this adapter
      request, // the http request from the requestOptions
      dsaConfig: ajaxConfig // the config arg from the calling Breeze DataServiceAdapter
    };

    if (core.isFunction(this.requestInterceptor)) {
      this.requestInterceptor(requestInfo);
      if ((this.requestInterceptor as any).oneTime) {
        this.requestInterceptor = null;
      }
    }

    function extractData(rawResponse: HttpResponse<any>) {
      let data: any;
      const dt = requestInfo.dsaConfig.dataType;
      // beware:`res.json` and `res.text` will be async some day
      if (dt && dt !== 'json') {
        data = rawResponse.body;
      } else {
        data = JSON.parse(rawResponse.body);
      }
      return { data, rawResponse };
    }

    if (!requestInfo.request) {
      return undefined;
    }

    try {
      // exists unless requestInterceptor killed it.
      const response = await this.http
        .request(requestInfo.request)
        .pipe(
          last(),
          map(extractData)
        )
        .toPromise();

      if (
        response.rawResponse.status < 200 ||
        response.rawResponse.status >= 300
      ) {
        throw { data: response.data, response: response.rawResponse };
      }

      const httpResponse: BreezeHttpResponse | any = {
        config: requestInfo.request,
        data: response.data.results || response.data.value || response.data,
        getHeaders: makeGetHeaders(response.rawResponse.headers),
        status: response.rawResponse.status
      };

      httpResponse.ngConfig = requestInfo.request;
      httpResponse.statusText = response.rawResponse.statusText;
      httpResponse.response = response.rawResponse;
      return httpResponse;
    } catch (err) {
      if (err instanceof Error) {
        throw Error('program error detect during ajax operations');
      }
      let data: any;
      if (err.error instanceof HttpResponse) {
        data = err.error.body;
      } else if (err.error instanceof Error) {
        data = err.error.message;
      } else {
        data = err.error;
      }

      // Timeout appears as an error with status===0 and no data.
      if (err.status === 0 && data == null) {
        data = 'timeout';
      }

      const errorMessage = err.status + ': ' + err.statusText;
      if (data && typeof data === 'object') {
        data.message = data.message || errorMessage; // breeze looks at the message property
      }
      if (!data) {
        data = errorMessage; // Return the error message as data
      }
      const httpResponse: BreezeHttpResponse | any = {
        config: requestInfo.request,
        data,
        getHeaders: makeGetHeaders(err.headers),
        status: err.status
      };
      httpResponse.ngConfig = requestInfo.request;
      httpResponse.statusText = err.statusText;
      httpResponse.response = err;
      throw new HttpErrorResponse(httpResponse);
    }
  }
}

function encodeParams(obj: {}) {
  let query = '';
  let subValue: any;
  let innerObj: any;
  let fullSubName: any;

  for (const name in obj) {
    if (!obj.hasOwnProperty(name)) {
      continue;
    }

    const value = obj[name];

    if (value instanceof Array) {
      for (let i = 0; i < value.length; ++i) {
        subValue = value[i];
        fullSubName = name + '[' + i + ']';
        innerObj = {};
        innerObj[fullSubName] = subValue;
        query += encodeParams(innerObj) + '&';
      }
    } else if (value && value.toISOString) {
      // a feature of Date-like things
      query +=
        encodeURIComponent(name) +
        '=' +
        encodeURIComponent(value.toISOString()) +
        '&';
    } else if (value instanceof Object) {
      for (const subName in value) {
        if (obj.hasOwnProperty(name)) {
          subValue = value[subName];
          fullSubName = name + '[' + subName + ']';
          innerObj = {};
          innerObj[fullSubName] = subValue;
          query += encodeParams(innerObj) + '&';
        }
      }
    } else if (value === null) {
      query += encodeURIComponent(name) + '=&';
    } else if (value !== undefined) {
      query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
    }
  }

  return query.length ? query.substr(0, query.length - 1) : query;
}

function makeGetHeaders(headers: HttpHeaders) {
  return function getHeaders(headerName?: string) {
    return headers.getAll(headerName).join('\r\n');
  };
}
