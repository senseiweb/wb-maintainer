import { Injectable } from '@angular/core';
import { AagtCoreModule } from './aagt-core.module';
import { SharepointAagtEntityList } from '@app_types';
import { RepoFactory } from 'app/core';
import { Generation, TriggerAction } from './aagt-data-models';
import { Predicate } from 'breeze-client';
// import { GenerationRepoService } from './aagt-data-access';

@Injectable({ providedIn: AagtCoreModule })
export class AagtUowService {
  constructor(private repoFactory: RepoFactory<SharepointAagtEntityList>) {}

  async fetchGenerationGraph(genId: number): Promise<Generation> {
    const assetRepo = this.repoFactory.getRepo('asset');
    const genAssetRepo = this.repoFactory.getRepo('generationAsset');
    const trigRepo = this.repoFactory.getRepo('trigger');
    const trigActRepo = this.repoFactory.getRepo('triggerAction');
    const ataRepo = this.repoFactory.getRepo('assetTriggerAction');
    const tjrRepo = this.repoFactory.getRepo('teamJobReservation');
    const tmAvailRepo = this.repoFactory.getRepo('teamJobReservation');

    const repos = [
      genAssetRepo,
      trigRepo,
      trigActRepo,
      ataRepo,
      tjrRepo,
      tmAvailRepo
    ];

    const repoQueries = repos.map(repo => {
      const pred = repo.makePredicate('generationId', genId);

      if (repo.entityType.shortName === 'TriggerAction') {
        return (repo.where(pred) as any).then(
          (trigActions: TriggerAction[]) => {
            const actionItemRepo = this.repoFactory.getRepo('actionItem');

            let predicate: Predicate;

            const actionItemIds = [
              ...new Set(trigActions.map(ta => ta.actionItemId))
            ];

            actionItemIds.forEach(actionItemId => {
              const aiPredicate = actionItemRepo.makePredicate(
                'id',
                actionItemId
              );

              predicate = predicate ? predicate.or(aiPredicate) : aiPredicate;
            });
            return actionItemRepo.where(predicate).catch(err => {
              console.log(err);
            });
          }
        );
      }
      repo.where(pred).catch(err => {
        console.log(err);
      });
    });

    repoQueries.push(assetRepo.getAll() as any);
    await Promise.all(repoQueries as any);

    const genRepo = this.repoFactory.getRepo('generation');
    const genPredicate = genRepo.makePredicate('id', genId);
    return genRepo.whereInCache(`genById-${genId}`, genPredicate)[0];
  }
}
