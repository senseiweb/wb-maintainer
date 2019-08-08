import {
  config,
  HttpResponse,
  JsonResultsAdapter,
  MappingContext,
  NodeContext,
  AbstractDataServiceAdapter,
  EntityType,
  core
} from 'breeze-client';

import * as _l from 'lodash';
import * as utils from './dataservice-utils';
import * as debounce from 'debounce-promise';
import { SpQueryDataService } from './sp-query.dataservice';
import { NodeMeta } from 'breeze-client/src/data-service';
import { ChangeRequestInterceptorCtor } from 'breeze-client/src/interface-registry';
import { dataReady } from '@syncfusion/ej2-grids';

export declare var OData: any;

export class SpDataService extends AbstractDataServiceAdapter {
  name = 'spDataService';
  private isInitialized = false;
  jsonResultsAdapter: JsonResultsAdapter;
  changeRequestInterceptor: ChangeRequestInterceptorCtor;
  debouncer: (contexts: MappingContext[][]) => Promise<any>;

  constructor() {
    super();
    this.jsonResultsAdapter = this.getJsonResultsAdapter();
    /** debounce promise takes an Array of argumenets and
     * place them in an array i.e. first call [arg1, arg2, arg3],
     * second call [arg4, arg5, arg6]
     * and puts them in an [firstcall, secondcall]
     */
    this.debouncer = debounce(
      (contexts: MappingContext[][]) => {
        const queryCtx = new SpQueryDataService(this.ajaxImpl, '');
        return queryCtx.executeQuery(contexts);
      },
      1500,
      {
        accumulate: true
      }
    );
  }

  static register(): void {
    config.registerAdapter('dataService', SpDataService);
    config.initializeAdapterInstance('dataService', 'spDataService', true);
  }

  executeQuery(mappingContext: MappingContext): Promise<any> {
    const query = mappingContext.query;

    if (typeof query === 'string' || !query.useSpBatchQuery) {
      const queryCtx = new SpQueryDataService(this.ajaxImpl, '');
      return queryCtx.executeSingleQuery(mappingContext);
    }
    return this.debouncer(mappingContext as any);
  }

  private unwrapResults(hResponse: HttpResponse) {
    let data: any = {};

    if (hResponse.data) {
      data = hResponse.data;
      data = data.d || data.value || data.results;
    } else if ((hResponse as any).results) {
      data = hResponse;
    }

    return data.results === undefined ? data : data.results;
  }

  extractResults = (response: HttpResponse | HttpResponse[]) => {
    let data = [];

    if (Array.isArray(response)) {
      response.forEach(r => {
        const dataResult = this.unwrapResults(r);
        data = data.concat(dataResult);
      });
      return data;
    }

    data = this.unwrapResults(response);
    return data;
  };

  extractSaveResults(serializedData: string): void {}

  fetchMetadata(): Promise<any> {
    throw new Error('Not Implmeneted');
  }

  getJsonResultsAdapter(): JsonResultsAdapter {
    const jraConfig = {
      name: 'SpCustomRestJson',
      extractResults: this.extractResults,
      extractSaveResults: this.extractSaveResults,
      visitNode: this.visitNode
    };

    return new JsonResultsAdapter(jraConfig);
  }

  initialize(): void {
    OData.jsonHandler.recognizeDates = true;
    OData.jsonHandler.useJsonLight = true;
    this.ajaxImpl = config.getAdapterInstance('ajax');
    this.isInitialized = true;
  }
  saveChanges(): any {}

  updateRequestDigest(digest: string): void {}

  visitNode(
    node: any,
    mappingContext: MappingContext,
    nodeContext: NodeContext
  ): NodeMeta {
    // TODO: maybe a problem when using expand relative objects...see sharepoint bz example
    const result: any = {};
    if (node == null) {
      return result;
    }

    let isStringCollection = false;

    const metadata = node.__metadata;
    if (metadata != null) {
      // TODO: may be able to make this more efficient by caching of the previous value.
      // const entityTypeName = MetadataStore.normalizeTypeName(metadata.type);
      const entityTypeName = utils.serverTypeNameToClient(metadata.type);

      // breeze expects metadata names to be Pascal Case, but sharepoint sends all lowercase;

      const et =
        entityTypeName &&
        (mappingContext.entityManager.metadataStore.getEntityType(
          entityTypeName,
          true
        ) as EntityType);

      // OData response doesn't distinguish a projection from a whole entity.
      // We'll assume that whole-entity data would have at least as many properties  (<=)
      // as the EntityType has mapped properties on the basis that
      // most projections remove properties rather than add them.
      // If not, assume it's a projection and do NOT treat as an entity
      if (et && et.dataProperties.length <= Object.keys(node).length - 1) {
        // if (et && et._mappedPropertiesCount === Object.keys(node).length - 1) { // OLD
        result.entityType = et;
        let uriKey = metadata.uri || metadata.id;
        if (uriKey) {
          // Strip baseUri to make uriKey a relative uri
          // Todo: why is this necessary when absolute works for every OData source tested?
          const re = new RegExp(
            '^' + mappingContext.dataService.serviceName,
            'i'
          );
          uriKey = uriKey.replace(re, '');
        }
        result.extraMetadata = {
          uriKey,
          etag: metadata.etag
        };
      }
      isStringCollection = metadata.type === 'SP.FieldChoice';
    }

    if (isStringCollection) {
      result.passThru = true;
    }
    // OData v3 - projection arrays will be enclosed in a results array
    if (node.results) {
      result.node = node.results;
    }

    const propertyName = nodeContext.propertyName;
    result.ignore =
      node.__deferred != null ||
      propertyName === '__metadata' ||
      // EntityKey properties can be produced by EDMX models
      (propertyName === 'EntityKey' &&
        node.$type &&
        core.stringStartsWith(node.$type, 'System.Data'));
    return result;
  }
}
