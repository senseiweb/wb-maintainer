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

type SpChoiceCache<T> = { [index in keyof T]: string[] };

export class CoreSharepointRepo<T extends SharepointEntity> extends CoreRepo<
  T
> {
  private spChoiceFieldCache: SpChoiceCache<T> = {} as any;

  constructor(
    entityTypeName: SharepointEntityList['shortname'],
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

  async spChoiceFields(fieldName: keyof T): Promise<string[]> {
    const cached = this.spChoiceFieldCache[fieldName];
    if (cached) {
      return cached;
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

    try {
      response = await this.entityManager.executeQuery(query);
    } catch (e) {
      throw new Error(e);
    }

    const choices = response.results[0].Choices.results as string[];

    this.spChoiceFieldCache[fieldName] = choices;
    return choices;
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
