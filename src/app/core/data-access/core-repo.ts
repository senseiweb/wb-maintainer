import { RawEntity, EntityList, PropsOfType, PropsNotOfType } from '@app_types';
import {
  EntityType,
  EntityState,
  EntityManager,
  EntityQuery,
  FilterQueryOp,
  Predicate,
  AndOrPredicate,
  SaveResult
} from 'breeze-client';
import * as _m from 'moment';
import { BreezeEntity } from '../data-models';
import { ActionItem } from 'app/feature/aagt/aagt-core';

interface IRepoPredicateCache {
  [index: string]: _m.Moment;
}

interface IRepoPromiseCache {
  [index: string]: Promise<any>;
}

export class CoreRepo<TRepoFor extends BreezeEntity> {
  protected resourceName: string;
  protected predicateCache: IRepoPredicateCache = {};
  protected promiseCache: IRepoPromiseCache = {};
  entityType: EntityType;

  constructor(
    entityTypeName: TRepoFor['shortname'],
    protected entityManager: EntityManager
  ) {
    this.entityType = entityManager.metadataStore.getEntityType(
      entityTypeName
    ) as EntityType;
    this.resourceName = this.entityType.defaultResourceName;
  }

  async getAll(spQuery: EntityQuery): Promise<TRepoFor[]> {
    const freshTimeLimit = 6;

    const cachedTime = this.predicateCache.all;

    const timeSinceLastServerQuery = cachedTime
      ? this.minutesSinceLastServerQuery(cachedTime)
      : freshTimeLimit + 1;

    if (timeSinceLastServerQuery < 5) {
      return (this.entityManager.getEntities(
        this.entityType
      ) as any) as TRepoFor[];
    }

    if (this.promiseCache.all) {
      return this.promiseCache.all;
    }

    this.promiseCache.all = new Promise(async (resolve, reject) => {
      try {
        const query = this.baseQuery('all');
        const results = await this.executeQuery(spQuery || query);
        resolve(results);
      } catch (error) {
        console.log(error);
        reject(error);
      } finally {
        this.promiseCache.all = undefined;
      }
    });
    return this.promiseCache.all;
  }

  baseQuery(qName?: string, toBaseType = true): EntityQuery {
    let query = EntityQuery.from(this.resourceName);

    if (qName) {
      query.name = qName;
    }

    query = query.select((this.entityType.custom as any).defaultSelect);

    if (!toBaseType) {
      return query;
    }
    query = query.toType(this.entityType);
    query.fromEntityType = this.entityType;
    return query;
  }

  create(options?: RawEntity<TRepoFor>): TRepoFor {
    return (this.entityManager.createEntity(
      this.entityType.shortName,
      options
    ) as any) as TRepoFor;
  }

  protected async executeQuery(query: EntityQuery): Promise<TRepoFor[]> {
    const dataQueryResult = await this.entityManager.executeQuery(query);

    if (query.name) {
      this.predicateCache[query.name] = _m();
    }
    return dataQueryResult.results as TRepoFor[];
  }

  protected executeCacheQuery(query: EntityQuery): TRepoFor[] {
    const localCache = this.entityManager.executeQueryLocally(
      query
    ) as TRepoFor[];
    return localCache;
  }

  isEntityCached(id: number): boolean {
    return ((this.entityManager.getEntities(
      this.entityType
    ) as any) as BreezeEntity[]).some(et => et.id === id);
  }

  makePredicate(
    property: PropsNotOfType<TRepoFor, Function>,
    condition: string | number,
    filter = FilterQueryOp.Equals
  ): Predicate {
    return Predicate.create(property as any, filter, condition);
  }

  // makeAnyPredicate<T>(property: keyof T, condition: string | number, filter = FilterQueryOp.Equals): Predicate {
  //   return this.makeAnyPredicate
  // }

  private minutesSinceLastServerQuery(cachedTime: _m.Moment) {
    return _m
      .duration(cachedTime.diff(_m()))
      .abs()
      .asMinutes();
  }

  queryFrom<TEntityName extends EntityList['shortname']>(
    entityName: TEntityName
  ): EntityQuery {
    const eType = this.entityManager.metadataStore.getEntityType(
      entityName
    ) as EntityType;

    const query = EntityQuery.from(eType.defaultResourceName)
      .toType(eType)
      .select((eType.custom as any).defaultSelect);

    return query;
  }

  async withId(key: number): Promise<TRepoFor> {
    const result = await this.entityManager.fetchEntityByKey(
      this.entityType.shortName,
      key,
      true
    );
    return (result.entity as any) as TRepoFor;
  }

  async where(
    predicate: Predicate | AndOrPredicate,
    queryName: string
  ): Promise<TRepoFor[]> {
    const freshTimeLimit = 6;

    const cachedTime = this.predicateCache[queryName];

    const timeSinceLastServerQuery = cachedTime
      ? this.minutesSinceLastServerQuery(cachedTime)
      : freshTimeLimit + 1;

    let query = this.baseQuery(queryName).where(predicate);

    query = predicate instanceof AndOrPredicate ? query.select('*') : query;

    if (timeSinceLastServerQuery < 5) {
      return Promise.resolve(this.executeCacheQuery(query));
    }

    const results = await this.executeQuery(query);

    return results;
  }

  whereInCache(queryName: string, predicate?: Predicate): TRepoFor[] {
    if (!predicate) {
      return (this.entityManager.getEntities(this.entityType, [
        EntityState.Unchanged,
        EntityState.Added,
        EntityState.Modified
      ]) as any) as TRepoFor[];
    }
    const query = this.baseQuery().where(predicate);
    return this.executeCacheQuery(query) as TRepoFor[];
  }

  async saveChangesForEntityType(): Promise<SaveResult> {
    const entities = (this.entityManager.getChanges(
      this.entityType
    ) as any) as BreezeEntity[];
    if (!entities.length) {
      return Promise.resolve(undefined);
    }
    entities.forEach(et => {
      if (et.isSoftDeleted) {
        et.entityAspect.setDeleted();
      }
    });
    this.entityManager.isSaving.next(true);
    const results = await this.entityManager
      .saveChanges(entities as any)
      .finally(() => {
        this.entityManager.isSaving.next(false);
      });
    return results;
  }
}
