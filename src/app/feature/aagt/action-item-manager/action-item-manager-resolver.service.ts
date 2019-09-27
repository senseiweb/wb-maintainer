import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { RepoFactory, SpChoiceResult } from 'app/core';
import { SharepointAagtEntityList } from '@app_types';
import { ActionItem, AagtCoreModule, AagtUowService } from '../aagt-core';
import { forkJoin } from 'rxjs';

export type ActionItemManagerResolvedData = [ActionItem[], SpChoiceResult];

@Injectable({ providedIn: AagtCoreModule })
export class ActionItemResolverService
  implements Resolve<ActionItemManagerResolvedData> {
  constructor(
    private repoFactory: RepoFactory<SharepointAagtEntityList>,
    private aagtUow: AagtUowService
  ) {}

  resolve(
    route: ActivatedRouteSnapshot
  ): Promise<ActionItemManagerResolvedData> {
    const actionItemRepo = this.repoFactory.getRepo('actionItem');
    const actionItemResourceRepo = this.repoFactory.getRepo(
      'actionItemResource'
    );
    return Promise.all([
      actionItemRepo.getAll(),
      actionItemResourceRepo.spChoiceFields('resourceCategory')
    ]);
  }
}
