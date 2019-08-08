import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import {
  Generation,
  AagtCoreModule
} from '../aagt-core';
import { RepoFactory } from 'app/core';
import { SharepointAagtEntityList } from '@app_types';

@Injectable({ providedIn: AagtCoreModule })
export class GenListResolverService implements Resolve<Generation> {
  constructor(private repoManager: RepoFactory<SharepointAagtEntityList>) { }
  resolve(route: ActivatedRouteSnapshot): Promise<any> {
    const genRepo = this.repoManager.getRepo('generation');
    return genRepo.getAll();
  }
}
