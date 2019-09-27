import {
  config,
  HttpResponse,
  JsonResultsAdapter,
  MappingContext,
  NodeContext,
  AbstractDataServiceAdapter,
  EntityType,
  core,
  SaveResult,
  SaveContext,
  SaveBundle
} from 'breeze-client';

import * as _l from 'lodash';
import * as debounce from 'debounce-promise';
import { SpQueryDataService } from './sp-query.dataservice';
import { NodeMeta } from 'breeze-client/src/data-service';
import { ChangeRequestInterceptorCtor } from 'breeze-client/src/interface-registry';
import { SpSaveDataService } from './sp-save.dataservice';
import { SharepointEntity } from 'app/core/data-models';
import { CustomDataServiceUtils } from './data-service-utils';
import { DoNotCare, CompatabilityFix } from '@app_types';
declare var OData: any;

export class SpDataService extends AbstractDataServiceAdapter {
  name = 'spDataService';
  utils: CustomDataServiceUtils;
  private isInitialized = false;
  jsonResultsAdapter: JsonResultsAdapter;
  changeRequestInterceptor: ChangeRequestInterceptorCtor;
  queryDebouncer: (contexts: MappingContext[][]) => Promise<any>;

  constructor() {
    super();
    this.utils = new CustomDataServiceUtils();
    this.jsonResultsAdapter = this.getJsonResultsAdapter();

    /** debounce promise takes an Array of argumenets and
     * place them in an array i.e. first call [arg1, arg2, arg3],
     * second call [arg4, arg5, arg6]
     * and puts them in an [firstcall, secondcall]
     */
    this.queryDebouncer = debounce(
      (contexts: MappingContext[][]) => {
        const queryCtx = new SpQueryDataService(this.utils);
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
      const queryCtx = new SpQueryDataService(this.utils);
      return queryCtx.executeSingleQuery(mappingContext);
    }
    return this.queryDebouncer(mappingContext as any);
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

  extractSaveResults(serializedData: string): any {
    let jsonData = serializedData;
    // Sharepoint deletes sends back an empty string
    if (!serializedData) {
      return serializedData;
    }
    if (typeof serializedData === 'string') {
      jsonData = JSON.parse(serializedData);
    }
    const data = (jsonData as any).d || jsonData;
    return data.results === undefined ? data : data.results;
  }

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
    this.utils.ajaxAdapter = this.ajaxImpl;
  }

  saveChanges(
    saveContext: SaveContext,
    saveBundle: SaveBundle
  ): Promise<SaveResult> {
    const saver = new SpSaveDataService([
      saveContext,
      saveBundle,
      this.jsonResultsAdapter,
      this.utils
    ]);
    return saver.save();
  }

  updateRequestDigest(digest: string): void {}

  visitNode = (
    node: any,
    mappingContext: MappingContext,
    nodeContext: NodeContext
  ): NodeMeta => {
    // TODO: maybe a problem when using expand relative objects...see sharepoint bz example
    const result: {
      entityType: SharepointEntity;
      passThru: boolean;
      node: DoNotCare;
      ignore: boolean;
    } = {} as CompatabilityFix;

    if (node == null) {
      return result as DoNotCare;
    }

    let isStringCollection = false;

    const metadata = node.__metadata;
    if (metadata != null) {
      // TODO: may be able to make this more efficient by caching of the previous value.
      // const entityTypeName = MetadataStore.normalizeTypeName(metadata.type);
      const entityTypeName = this.utils.serverTypeNameToClient(metadata.type);

      // breeze expects metadata names to be Pascal Case, but sharepoint sends all lowercase;

      const et =
        entityTypeName &&
        (mappingContext.entityManager.metadataStore.getEntityType(
          entityTypeName,
          true
        ) as EntityType);

      /**
       * OData response doesn't distinguish a projection from a whole entity.
       * We'll assume that whole-entity data would have at least as many properties  (<=)
       * as the EntityType has mapped properties on the basis that
       * most projections remove properties rather than add them.
       * If not, assume it's a projection and do NOT treat as an entity
       * IMPORTANT: For OData endpoints (at SP's) to subject out the nav properties
       * that breezejs counts as mapped properties but are never sent by the
       * server.
       */
      if (
        et &&
        et._mappedPropertiesCount - et.navigationProperties.length <=
          Object.keys(node).length - 1
      ) {
        result.entityType = (et as CompatabilityFix) as SharepointEntity;
        const uriKey = metadata.uri || metadata.id;

        if (uriKey) {
          metadata.uri = uriKey;
        }
        result.entityType.__metadata = {
          shortname: undefined,
          repoName: undefined,
          etag: metadata.etag,
          uri: metadata.uri,
          id: metadata.id,
          type: metadata.type
        };
        // result.extraMetadata = {
        //   uriKey,
        //   etag: metadata.etag
        // };
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
    return result as DoNotCare;
  };
}
