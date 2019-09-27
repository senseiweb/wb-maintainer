import {
  EntityManager,
  DataService,
  NamingConvention,
  MetadataStore,
  EntityAction,
  SaveResult
} from 'breeze-client';
import '../breeze-providers/sharepoint-dataservice';
import { EmServiceProviderConfig } from './emServiceProviderConfig.service';
import { CustomNameConventionService } from '../breeze-providers/custom-name-convention.service';
import { Injectable } from '@angular/core';
import { DataAccessModule } from '../data-access.module';
import {
  IBreezeScaffoldProto,
  EntityList,
  EntityChangedArgType,
  GetEntityProp,
  IEntityChangedEvent,
  IEntityPropertyChange
} from '@app_types';
import * as debounce from 'debounce-promise';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { SharepointMetadata, BreezeEntity } from 'app/core/data-models';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import * as _m from 'moment';
import * as _l from 'lodash';
import { chartScrollElement } from '@syncfusion/ej2-gantt/src/gantt/base/css-constants';
import { Save } from '@syncfusion/ej2-file-utils';

// List of models that are used across feature setsl
const GlobalModel = [SharepointMetadata];

@Injectable({ providedIn: DataAccessModule })
export class EmServiceProviderFactory {
  private metaStore: MetadataStore;
  private repoStore = {};

  private saveDebounce: (
    entityBundler: [BreezeEntity][]
  ) => Promise<SaveResult>;

  constructor(
    private nameDictService: CustomNameConventionService,
    private http: HttpClient
  ) {
    this.initEmServiceProvider();
  }

  initEmServiceProvider(): void {
    const nameDictionaryService = this.nameDictService;

    const namingDictionary = {};

    nameDictionaryService
      .createNameDictionary(
        'spNameCov',
        NamingConvention.camelCase,
        namingDictionary
      )
      .setAsDefault();

    this.metaStore = new MetadataStore();

    GlobalModel.forEach((bzEntityScaffold: any) => {
      (bzEntityScaffold.prototype as IBreezeScaffoldProto).spBzEntity.createTypeForStore(
        this.metaStore,
        this.nameDictService,
        'Global'
      );
    });
  }

  createManager(mgrCfg: EmServiceProviderConfig): EntityManager {
    const dataService = new DataService({
      serviceName: mgrCfg.serviceEndpoint,
      hasServerMetadata: false,
      adapterName: mgrCfg.adapterName
    });

    dataService.getRequestDigest = this.getRequestDigest(mgrCfg);
    dataService.odataAppEndpoint = mgrCfg.odataAppEndPoint;

    const em = new EntityManager({
      dataService,
      metadataStore: this.metaStore
    });

    const bzEntities = mgrCfg.featureEntities;

    bzEntities.forEach((bzEntityScaffold: any) => {
      (bzEntityScaffold.prototype as IBreezeScaffoldProto).spBzEntity.createTypeForStore(
        this.metaStore,
        this.nameDictService,
        mgrCfg.nameSpace
      );
    });
    em.isSaving = new BehaviorSubject(false);
    em.onModelChanges = this.watchModelChanges(em);
    return em;
  }

  // debounceSave(
  //   em: EntityManager
  // ): (entity: BreezeEntity) => Promise<SaveResult> {
  //   const saveDebounce = debounce(
  //     (contexts: [BreezeEntity][]) => {
  //       const entitiesToSave = _l.flatMap(contexts, x => x.map(c => c));
  //       return em.saveChanges(entitiesToSave as any[]);
  //     },
  //     1500,
  //     { accumulate: true }
  //   );
  //   return entity => saveDebounce(entity as any);
  // }

  getRequestDigest(mgrCfg: EmServiceProviderConfig): () => Promise<string> {
    let tokenExpireTime = _m();
    let digestToken = '';
    let tokenPromise: Promise<string>;

    return () => {
      const isExpired = _m().diff(tokenExpireTime, 'minute') > 5;

      if (digestToken && !isExpired) {
        return Promise.resolve(digestToken);
      }

      const headers = new HttpHeaders({
        'Content-Type': 'application/json;odata=minimalmetadata',
        Accept: 'application/json;odata=verbose'
      });

      if (tokenPromise) {
        return tokenPromise;
      }

      tokenPromise = this.http
        .post(mgrCfg.ctxEndpoint, undefined, { headers })
        .toPromise()
        .then(ctxResponse => {
          digestToken = (ctxResponse as any).d.GetContextWebInformation
            .FormDigestValue;
          const timeoutSeconds = (ctxResponse as any).d.GetContextWebInformation
            .FormDigestTimeoutSeconds;

          tokenExpireTime = _m().add(timeoutSeconds, 'second');
          tokenPromise = undefined;
          return digestToken;
        });
      return tokenPromise;
    };
  }

  private watchModelChanges(em: EntityManager): any {
    const onEntityChanges = new Subject();
    em.entityChanged.subscribe(changedArgs => {
      changedArgs.shortName = changedArgs.entity.shortname;

      switch (changedArgs.entityAction as EntityAction) {
        case EntityAction.PropertyChange:
          changedArgs.entityActionName = 'PropertyChange';
          break;
        case EntityAction.EntityStateChange:
          changedArgs.entityActionName = 'EntityState';
          break;
      }

      onEntityChanges.next(changedArgs);
    });
    return <
      TEntityList extends EntityList,
      TEntityName extends TEntityList['shortname'],
      TEntityAction extends EntityChangedArgType<
        TEntityName,
        any
      >['entityAction'],
      TEntityProp extends GetEntityProp<TEntityName>
    >(
      shortName: TEntityName,
      etAction?: TEntityAction,
      property?: TEntityProp | TEntityProp[]
    ): Observable<
      IEntityChangedEvent<TEntityList, TEntityName, TEntityAction, TEntityProp>
    > => {
      const shortNameArrayed = Array.isArray(shortName)
        ? shortName
        : [shortName];
      const propertyArrayed =
        property && Array.isArray(property) ? property : [property];

      const ecObserverable = onEntityChanges.pipe(
        filter(
          (
            chngArgs: IEntityChangedEvent<
              TEntityList,
              TEntityName,
              TEntityAction,
              any
            >
          ) => {
            if (!shortNameArrayed.includes(chngArgs.shortName)) {
              return false;
            }

            if (etAction && chngArgs.entityActionName !== etAction) {
              return false;
            }

            if (
              property &&
              !propertyArrayed.includes((chngArgs.args as any).propertyName)
            ) {
              return false;
            }

            return true;
          }
        )
      );

      return ecObserverable;
    };
  }
}
