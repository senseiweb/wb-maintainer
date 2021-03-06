import {
  AutoGeneratedKeyType,
  DataProperty,
  EntityState,
  SaveResult,
  EntityKey
} from 'breeze-client';
import * as _m from 'moment';
import { BreezeEntity, SharepointEntity } from 'app/core/data-models';
import {
  IODataBatchData,
  IODataBatchResponse,
  IODataRequest,
  IODataPayload,
  IOdataaChangeSet
} from '@app_types';
import { DataServiceSaveEntityData } from './data-service-utils';
import { SpConfig } from 'app/core/config/app-config';

declare var OData: any;

export class SpSaveDataService {
  private headers = {
    DataServiceVersion: '3.0',
    MaxDataServiceVersion: '3.0',
    Accept: 'application/json;odata=minimalmetadata',
    'X-REQUESTDIGEST': undefined
  };

  constructor(private entitySaveData: DataServiceSaveEntityData) {}

  handleAddChangeSet(
    entity: BreezeEntity,
    contentId: number
  ): IOdataaChangeSet {
    const [saveContext, , , utils] = this.entitySaveData;
    const em = saveContext.entityManager;
    const et = entity.entityType;

    if (!entity.entityType.defaultResourceName) {
      throw new Error(
        `Missing resource name for type: ${entity.entityType.name}`
      );
    }

    if (entity.entityType.autoGeneratedKeyType !== AutoGeneratedKeyType.None) {
      // Content-ID is always non-zero based index; however, arrays are zero based
      // using the -1 will compensate for the differences.
      saveContext.tempKeys[contentId - 1] = entity.entityAspect.getKey();
    }

    const requestUri = em.dataService.qualifyUrl(et.defaultResourceName);

    const rawEntity = em.helper.unwrapInstance(
      entity as any,
      utils.transformValue
    );
    rawEntity.__metadata = {
      type: utils.clientTypeNameToServer(et.shortName)
    };

    const headers = Object.assign({}, this.headers);
    headers['CONTENT-ID'] = contentId;
    headers['CONTENT-TYPE'] = 'application/json;odata=minimalmetadata';
    headers['X-HTTP-METHOD'] = 'POST';
    delete headers['X-REQUESTDIGEST'];

    return {
      method: 'POST',
      requestUri,
      headers,
      data: rawEntity
    };
  }

  handleDeleteChangeSet(
    entity: BreezeEntity,
    contentId: number
  ): IOdataaChangeSet {
    const headers = Object.assign({}, this.headers);
    headers['IF-MATCH'] = '*';
    headers['CONTENT-ID'] = contentId;
    /**
     * Gotcha -- Sharepoint requires a write operations to have a POST method
     * with an additional X-HTTP-METHOD indicating the action
     */
    headers['X-HTTP-METHOD'] = 'DELETE';
    headers['CONTENT-TYPE'] = 'application/json;odata=minimalmetadata';
    delete headers['X-RequestDigest'];

    const requestUri = (entity as any).__metadata.uri;

    return {
      method: 'POST',
      requestUri,
      headers,
      data: undefined
    };
  }

  handleUpdateChangeSet(
    entity: BreezeEntity,
    contentId: number
  ): IOdataaChangeSet {
    const [saveContext, , , utils] = this.entitySaveData;
    const em = saveContext.entityManager;

    const rawEntity = em.helper.unwrapInstance(entity as any);

    const headers = Object.assign({}, this.headers);
    headers['CONTENT-ID'] = contentId;
    headers['IF-MATCH'] = '*';
    /**
     * Gotcha -- Sharepoint requires a write operations to have a POST method
     * with an additional X-HTTP-METHOD indicating the action
     */
    headers['X-HTTP-METHOD'] = 'MERGE';
    headers['CONTENT-TYPE'] = 'application/json;odata=minimalmetadata';
    delete headers['X-REQUESTDIGEST'];
    const requestUri = rawEntity.__metadata.uri;

    // check to see if __metadata type is added from this
    const changedData = em.helper.unwrapChangedValues(
      entity as any,
      em.metadataStore,
      utils.normalizeSaveValue
    );

    (changedData as any).__metadata = {
      type: (entity as SharepointEntity).__metadata.type
    };

    return {
      method: 'POST',
      requestUri,
      headers,
      data: changedData
    };
  }

  private async prepareSaveBundles(): Promise<
    IOdataaChangeSet | IODataRequest
  > {
    const [saveCtx, saveBundle] = this.entitySaveData;
    const dataService = saveCtx.entityManager.dataService;

    saveCtx.tempKeys = [];

    saveCtx.originalEntities = [];
    const saveResult: SaveResult = {
      entities: [],
      entitiesWithErrors: [],
      keyMappings: [],
      deletedKeys: []
    };

    saveCtx.saveResult = saveResult;

    let idx = 0;

    const changeSets = [] as IOdataaChangeSet[];

    for (const entity of (saveBundle.entities as any[]) as BreezeEntity[]) {
      const eState = entity.entityAspect.entityState;

      const contentId = idx + 1;

      saveCtx.originalEntities[idx] = entity;

      switch (eState) {
        case EntityState.Added:
          changeSets.push(this.handleAddChangeSet(entity, contentId));
          break;

        case EntityState.Modified:
          changeSets.push(this.handleUpdateChangeSet(entity, contentId));
          break;

        case EntityState.Deleted:
          changeSets.push(this.handleDeleteChangeSet(entity, contentId));
          break;

        default:
          throw new Error(
            `Cannot save an entity whose EntityState is ${eState.name}`
          );
      }
      idx += 1;
    }

    let digest: string;
    try {
      digest = await dataService.getRequestDigest();
    } catch (error) {
      console.error('Failed to updated digest token');
    }

    if (changeSets.length === 1) {
      const request = changeSets[0];
      request.headers['X-REQUESTDIGEST'] = digest;
      const knownUri = (saveCtx.originalEntities[0] as SharepointEntity)
        .__metadata.uri;
      if (knownUri) {
        request.requestUri = request.requestUri.replace(
          /.*\/\/[^\/]*/,
          SpConfig.cfgWebApplicationSite
        );
      }

      return request;
    }

    changeSets.forEach(changeSet => {
      changeSet.requestUri = changeSet.requestUri.replace(
        /.*\/\/[^\/]*/,
        SpConfig.cfgSharepointMainAppSite
      );
      changeSet.method = changeSet.headers['X-HTTP-METHOD'];
      delete changeSet.headers['X-HTTP-METHOD'];
    });

    const batchData: IODataBatchData = {
      __batchRequests: [
        {
          __changeRequests: changeSets
        }
      ]
    };

    const headers = Object.assign({}, this.headers);
    headers['X-REQUESTDIGEST'] = digest;
    const odataRequest: IODataRequest = {
      headers,
      requestUri: dataService.odataAppEndpoint,
      method: 'POST',
      data: batchData
    };

    return odataRequest;
  }

  private makeSaveResult(
    batchResponse: IODataBatchResponse | IODataPayload,
    originalEnity: BreezeEntity,
    tmpKey?: EntityKey
  ): void {
    const [saveCtx, , jra] = this.entitySaveData;

    if (
      !batchResponse ||
      !batchResponse.statusCode ||
      batchResponse.statusCode >= 400
    ) {
      saveCtx.saveResult.entitiesWithErrors.push(originalEnity as any);
      return;
    }

    if (originalEnity.entityAspect.entityState.isDeleted()) {
      saveCtx.saveResult.deletedKeys.push({
        entityTypeName: originalEnity.entityType.name,
        keyValues: [originalEnity.entityAspect.getKey()]
      });
      return;
    }

    // assume one entity per save changeset, but may need to revisit if multiple result entities are exctracted
    const rawEntity =
      jra.extractSaveResults(batchResponse.data) || originalEnity;

    const headerKeys = Object.keys(batchResponse.headers);

    for (const key of headerKeys) {
      const lc = key.toLowerCase();
      batchResponse.headers[lc] = batchResponse.headers[key];
    }

    let newEtag = (batchResponse.headers as any).etag;

    // Sharepoint's metadata comes with an additional quotation mark that needs
    // to be removed
    newEtag = newEtag && newEtag.split(',')[1];

    newEtag = newEtag ? newEtag.replace(/['"]+/g, '') : '*';

    rawEntity.__metadata.etag = newEtag || '*';

    if (tmpKey) {
      const tempEntityType = tmpKey.entityType;

      if (tempEntityType.autoGeneratedKeyType === AutoGeneratedKeyType.None) {
        const tmpValue = tmpKey.values[0];
        const realKey = tempEntityType.getEntityKeyFromRawEntity(
          rawEntity,
          DataProperty.getRawValueFromServer
        );

        const keyMapping = {
          entityTypeName: tempEntityType.name,
          tempValue: tmpValue,
          realValue: realKey.values[0]
        };

        saveCtx.saveResult.keyMappings.push(keyMapping);
      }
    }
    saveCtx.saveResult.entities.push(rawEntity);

    return;
  }

  private processServerResponse = (
    batchResponse: [IODataBatchResponse[], IODataPayload]
  ): void => {
    const [saveCtx] = this.entitySaveData;

    saveCtx.saveResult.httpResponse = batchResponse[0]
      ? batchResponse[0]
      : (batchResponse[1] as any);

    /**
     * if the batch response is undefined the assumption
     * is that there was a single query operation
     */
    if (!batchResponse[0]) {
      const originalEnity = saveCtx.originalEntities[0];
      const tmpKey = saveCtx.tempKeys[0];
      this.makeSaveResult(batchResponse[1], originalEnity, tmpKey);
      return;
    }

    let idx = 0;

    for (const response of batchResponse[0]) {
      const originalEnity = saveCtx.originalEntities[idx];
      const tmpKey = saveCtx.tempKeys[idx];

      response.statusCode =
        typeof response.statusCode === 'string'
          ? +response.statusCode
          : response.statusCode;

      this.makeSaveResult(response, originalEnity, tmpKey);

      idx++;
    }
  };

  saveOdata(
    request: IOdataaChangeSet | IODataRequest
  ): Promise<[IODataBatchResponse[], IODataPayload]> {
    const [saveCtx, saveBundle] = this.entitySaveData;

    return new Promise((resolve, reject) => {
      if (saveBundle.entities.length === 1) {
        OData.read(
          request,
          (unusedData, svrResponse) => resolve([undefined, svrResponse as any]),
          error => reject(error),
          OData.jsonHandler
        );
      } else {
        OData.request(
          request,
          (batchResponse, payload) =>
            resolve([batchResponse.__batchResponses, payload]),
          error => reject(error),
          OData.batchHandler
        );
      }
    });
  }

  save(): Promise<SaveResult> {
    const [saveCtx, , , utils] = this.entitySaveData;
    // Assumption that all batch saves are happening in the same dataservie
    return new Promise(async (resolve, reject) => {
      try {
        const saveBundle = await this.prepareSaveBundles();
        const response = await this.saveOdata(saveBundle);
        this.processServerResponse(response);
        resolve(saveCtx.saveResult);
      } catch (e) {
        utils.createError(e);
        reject(e);
      }
    });
  }
}
