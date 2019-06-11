import { Injectable } from '@angular/core';
import {
  config,
  core,
  DataServiceAdapter,
  EntityType,
  HttpResponse,
  JsonResultsAdapter,
  MappingContext,
  MetadataStore,
  NodeContext,
  SaveBundle,
  SaveContext,
  SaveResult,
  EntityQuery
} from 'breeze-client';

import * as _l from 'lodash';

import { sp } from '@pnp/sp';
import { HttpClient } from '@angular/common/http';
import { DataAccessModule } from './data-access.module';
import * as debounce from 'debounce-promise';
import { SpQueryDataService } from './sp-query.dataservice';

@Injectable({ providedIn: DataAccessModule })
export class SpDataService {
  private listToFetch = [];

  constructor(private http: HttpClient) {
    sp.setup({
      spfxContext: SP.ClientContext
    });
  }

  executeQuery(mappingContext: MappingContext): Promise<any> {
    const query = mappingContext.query;

    const queryCtx = new SpQueryDataService(this.http);

    if (typeof query === 'string' || !query.useSpEntityQuery) {
      return queryCtx.executeRestQuery(mappingContext);
    }

    if (!query.canBeBatched) {
      return queryCtx.executeSpSingleQuery(mappingContext);
    }

    this.listToFetch.push(mappingContext);

    return debounce(queryCtx.executeSpBatchQuery, 15000, {
      accumulate: true
    }) as any;
  }
}
