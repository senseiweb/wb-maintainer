import { EntityManager } from 'breeze-client';
import {
  GlobalRepoManagerExtended,
  EntityList,
  SharepointEntityList,
  SelectedEntityKind,
  GetEntityType,
  GetSpEntityType,
  GlobalEntityList
} from '@app_types';
import { CoreSharepointRepo } from './core-sharepoint-repo';
import { CoreRepo } from './core-repo';
import { HttpClient } from '@angular/common/http';

export type RepoReturn<
  U extends GlobalEntityList['shortname'] | SharepointEntityList['shortname']
> = U extends SharepointEntityList['shortname']
  ? CoreSharepointRepo<GetSpEntityType<U>>
  : CoreRepo<GetEntityType<U>>;

export class RepoFactory<T extends EntityList> {
  static repoStore: { [index: string]: CoreRepo<any> } = {};

  constructor(
    public entityManager: EntityManager,
    private httpClient: HttpClient
  ) {}

  private initializedRepo(
    repoName: string,
    useSpRepo = true
  ): CoreRepo<any> | CoreSharepointRepo<any> {
    let newRepo: CoreRepo<any> | CoreSharepointRepo<any>;
    const repoAlias = repoName.charAt(0).toUpperCase() + repoName.slice(1);

    if (!useSpRepo) {
      newRepo = new CoreRepo(repoAlias as any, this.entityManager);
    } else {
      newRepo = new CoreSharepointRepo(
        repoAlias as any,
        this.httpClient,
        this.entityManager
      );
    }
    RepoFactory.repoStore[repoName] = newRepo;
    return newRepo;
  }

  getRepo<
    TShartName extends
      | GlobalEntityList['shortname']
      | SharepointEntityList['shortname']
  >(repoName: TShartName, useSpRepo = true): RepoReturn<TShartName> {
    if (RepoFactory.repoStore[repoName]) {
      return RepoFactory.repoStore[repoName] as RepoReturn<TShartName>;
    }

    return this.initializedRepo(repoName, useSpRepo) as RepoReturn<TShartName>;
  }
}
