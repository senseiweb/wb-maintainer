import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import {
  Generation,
  AagtCoreModule,
  AagtUowService,
  GenStatusEnum,
  ActionItem,
  Asset
} from '../aagt-core';
import { RepoFactory } from 'app/core';
import { SharepointAagtEntityList } from '@app_types';

export type PlanGenResolvedData = [Generation, Asset[], ActionItem[], string[]];

@Injectable({ providedIn: AagtCoreModule })
export class PlanGenResolverService implements Resolve<PlanGenResolvedData> {
  private genEntityGraphLoaded = [];
  constructor(
    private repoFactory: RepoFactory<SharepointAagtEntityList>,
    private aagtUow: AagtUowService
  ) {}

  async resolve(route: ActivatedRouteSnapshot): Promise<PlanGenResolvedData> {
    let id = route.params.id;
    const genRepo = this.repoFactory.getRepo('generation');

    if (id === 'new') {
      const assetRepo = this.repoFactory.getRepo('asset');
      const actionItemRepo = this.repoFactory.getRepo('actionItem');
      this.repoFactory.getRepo('generation');

      const results = await Promise.all([
        assetRepo.getAll(),
        actionItemRepo.getAll(),
        genRepo.spChoiceFields('iso')
      ]);

      const newGen = genRepo.create({ genStatus: GenStatusEnum.Draft });
      return [newGen, results[0], results[1], results[2]];
    }

    id = +id;

    // if (!this.genEntityGraphLoaded.includes(id)) {
    //   return new Promise(async (resolve, reject) => {
    //     try {
    //       const generation = await genRepo.withId(id);
    //       const generationGroph = await this.aagtUow.fetchGenerationGraph(id);
    //       if (generationGroph) {
    //         this.genEntityGraphLoaded.push(id);
    //       }
    //       resolve(generation);
    //     } catch (e) {
    //       reject(e);
    //     }
    //   });
    // }
  }
}
