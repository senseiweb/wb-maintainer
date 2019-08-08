import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Generation, AagtCoreModule, AagtUowService } from '../aagt-core';
import { RepoFactory } from 'app/core';
import { SharepointAagtEntityList } from '@app_types';

@Injectable({ providedIn: AagtCoreModule })
export class GenListDetailResolverService implements Resolve<Generation> {
  private genEntityGraphLoaded = [];
  constructor(
    private repoFactory: RepoFactory<SharepointAagtEntityList>,
    private aagtUow: AagtUowService
  ) {}

  resolve(route: ActivatedRouteSnapshot): Promise<any> {
    let id = route.params.id;
    const genRepo = this.repoFactory.getRepo('generation');

    if (typeof id === 'string') {
      id = +id;
    }

    if (!this.genEntityGraphLoaded.includes(id)) {
      return new Promise(async (resolve, reject) => {
        try {
          const generation = await genRepo.withId(id);
          const generationGroph = await this.aagtUow.fetchGenerationGraph(id);
          if (generationGroph) {
            this.genEntityGraphLoaded.push(id);
          }
          resolve(generation);
        } catch (e) {
          reject(e);
        }
      });
    }

    return genRepo.withId(id);
  }
}
