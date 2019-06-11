import { sp, Items } from '@pnp/sp';

import { MappingContext, Entity, EntityType } from 'breeze-client';
import { ISpEntityType } from '@app_types/breeze-extension';
import { HttpClient } from '@angular/common/http';

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
  constructor(private httpClient: HttpClient) {}

  async executeRestQuery(mc: MappingContext): Promise<void> {}

  async executeSpBatchQuery(mcArray: MappingContext[]): Promise<any> {
    const batch = sp.web.createBatch();

    const results = [];
    let listItem: Items;

    for (const mc of mcArray) {
      const httpResponse: Partial<IBzHttpResponse> = {};

      listItem = this.prepareQuery(mc);
      httpResponse.spConfig = listItem;
      if (listItem) {
        listItem
          .inBatch(batch)
          .get()
          .then(response => {
            httpResponse.data = response;
            results.push(httpResponse);
          })
          .catch(error => {
            httpResponse.error = error;
            results.push(httpResponse);
          });
      }
    }

    try {
      await batch.execute();
    } catch (e) {
      console.log('Error trying to initiate query');
      throw new Error(e);
    }
  }

  private prepareQuery(mc: MappingContext): Items {
    if (typeof mc.query === 'string' || !mc.query.fromEntityType) {
      return undefined;
    }

    const et = (mc.query.fromEntityType as any) as ISpEntityType;

    const list = sp.web.lists.getByTitle(et.shortName).items;

    const defaultSelect = et.custom.defaultSelect.split(',');

    if (mc.query.getAllWithMax) {
      list.top(mc.query.getAllWithMax || mc.query.spQueryOptions.$top || 4000);
    }

    if (mc.query.spQueryOptions.$filter) {
      list.filter(mc.query.spQueryOptions.$filter);
    }

    if (mc.query.spQueryOptions.$skip) {
      list.skip(mc.query.spQueryOptions.$skip);
    }

    const lookups = mc.query.expand;

    if (Array.isArray(lookups)) {
      lookups.forEach(lookup => {
        const idx = defaultSelect.findIndex(lookup);
        defaultSelect.splice(idx, 1);
        defaultSelect.push(`${lookup}/ID`);
        list.expand(lookup);
      });
    }

    list.select(...defaultSelect);
  }

  async executeSpSingleQuery(mc: MappingContext): Promise<any> {
    const listItem = this.prepareQuery(mc);
    const httpResponse: Partial<IBzHttpResponse> = {};

    httpResponse.spConfig = listItem;

    if (listItem) {
      try {
        const response = await listItem.get();
        httpResponse.data = response;
        return httpResponse;
      } catch (e) {
        httpResponse.error = e;
        return httpResponse;
      }
    }
  }
}
