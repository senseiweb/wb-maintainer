import { CoreRepo } from './core-repo';
import { SharepointEntity } from '../data-models';
import { SharepointEntityList, EntityChildrenKind } from '@app_types';
import {
  Predicate,
  AndOrPredicate,
  EntityManager,
  EntityQuery,
  FilterQueryOp,
  QueryResult
} from 'breeze-client';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export type SpChoiceCache<T> = {
  [index in keyof T]: {
    values: string[];
    editUri: string;
    type: string;
    defaultValue: string;
  };
};

export type SpChoiceResult = [string, string[]];

export class CoreSharepointRepo<T extends SharepointEntity> extends CoreRepo<
  T
> {
  private commonHttpHeaders = {
    DataServiceVersion: '3.0',
    MaxDataServiceVersion: '3.0',
    Accept: 'application/json;odata=nometadata',
    'Content-Type': 'application/json;odata=verbose',
    'X-RequestDigest': undefined
  };
  private spChoiceFieldCache: SpChoiceCache<T> = {} as any;

  constructor(
    entityTypeName: SharepointEntityList['shortname'],
    private httpClient: HttpClient,
    protected entityManager: EntityManager
  ) {
    super(entityTypeName, entityManager);
  }

  getAll(): Promise<T[]> {
    const query = this.baseQuery('all');
    query.name = 'all';
    query.getAllWithMax = query.getAllWithMax || 4000;
    query.useSpBatchQuery = query.useSpBatchQuery || true;
    return super.executeQuery(query);
  }

  async updateSpChoiceFields(
    fieldName: keyof T,
    values: string[]
  ): Promise<string[]> {
    const cachedSpChoiceData = this.spChoiceFieldCache[fieldName];

    const digest = await this.entityManager.dataService.getRequestDigest();

    const payload = {
      __metadata: { type: 'SP.FieldChoice' },
      Choices: {
        results: values
      }
    };

    const updateHeaders = {
      'X-HTTP-METHOD': 'MERGE',
      'IF-MATCH': '*'
    };
    this.commonHttpHeaders['X-RequestDigest'] = digest;

    const requestHeaders = new HttpHeaders(
      Object.assign(updateHeaders, this.commonHttpHeaders)
    );

    const response = await this.httpClient
      .post(cachedSpChoiceData.editUri, payload, {
        headers: requestHeaders
      })
      .toPromise();

    cachedSpChoiceData.values = values;
    return values;
  }

  spChoiceFields(fieldName: keyof T, onlyCached?: boolean): SpChoiceResult;
  spChoiceFields(
    fieldName: keyof T,
    onlyCached?: boolean
  ): Promise<SpChoiceResult> | SpChoiceResult {
    let cached = this.spChoiceFieldCache[fieldName];

    if (onlyCached || cached) {
      if (!cached) {
        throw new Error(
          'Cached data was demanded but not available on the client!'
        );
      }
      return [cached.defaultValue, cached.values];
    }

    const defaultResourceName = this.entityType.defaultResourceName;

    const fieldsResourceName = defaultResourceName.replace('/items', '/fields');

    const dp = this.entityType.dataProperties.find(
      prop => prop.name === fieldName
    );

    const predicate = Predicate.create(
      'EntityPropertyName',
      FilterQueryOp.Equals,
      dp.nameOnServer
    );

    const query = EntityQuery.from(fieldsResourceName)
      .where(predicate)
      .noTracking();

    let response: QueryResult;

    return (async () => {
      response = await this.entityManager.executeQuery(query);
      const spChoiceFieldData = response.results[0];

      cached = {
        values: spChoiceFieldData.Choices.results,
        editUri: spChoiceFieldData.__metadata.edit,
        type: spChoiceFieldData.__metadata.type,
        defaultValue: spChoiceFieldData.DefaultValue
      };

      this.spChoiceFieldCache[fieldName as any] = cached;

      return [cached.defaultValue, cached.values] as SpChoiceResult;
    })();
  }

  queryFromSp<TEntityName extends SharepointEntityList['shortname']>(
    eName: TEntityName
  ): EntityQuery {
    return this.queryFrom(eName);
  }

  async where(predicate: Predicate | AndOrPredicate): Promise<T[]> {
    const query = this.baseQuery().where(predicate);

    // query = predicate instanceof AndOrPredicate ? query.select('*') : query;

    query.useSpBatchQuery = true;

    const results = await this.executeQuery(query);

    return results;
  }

  async whereWithChildren<TChild extends EntityChildrenKind<T>>(
    predicate: Predicate,
    childRepoService: CoreSharepointRepo<T>,
    childLookupKey: TChild
  ): Promise<{ parent: T[]; children: TChild[] }> {
    const parent = await this.where(predicate);

    const pIds = parent.map(et => et.id).sort();

    const childPreds: Predicate[] = [];

    pIds.forEach(id => {
      childPreds.push(
        childRepoService.makePredicate(childLookupKey as any, id)
      );
    });

    const cPredicate = Predicate.or(childPreds);

    const children = await childRepoService.where(cPredicate);

    return { parent, children } as any;
  }
}
