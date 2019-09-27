import { Injectable } from '@angular/core';
import { AagtCoreModule } from './aagt-core.module';
import {
  SharepointAagtEntityList,
  IAtasGantt,
  SelectedEntityKind
} from '@app_types';
import { RepoFactory, CoreSharepointRepo, SharepointEntity } from 'app/core';
import {
  Generation,
  TriggerAction,
  AssetTriggerAction,
  ActionItem
} from './aagt-data-models';
import { Predicate, EntityManager, SaveResult } from 'breeze-client';
import * as _m from 'moment';
import * as _l from 'lodash';
import { ActionItemResource } from './aagt-data-models/action-item-resource';

export interface IAtaData {
  projectStart: Date;
  projectEnd: Date;
  tasks: IAtasGantt[];
}

@Injectable({ providedIn: AagtCoreModule })
export class AagtUowService {
  entityManager: EntityManager;

  constructor(private repoFactory: RepoFactory<SharepointAagtEntityList>) {
    this.entityManager = repoFactory.entityManager;
  }

  async fetchGenerationGraph(genId: number): Promise<Generation> {
    const assetRepo = this.repoFactory.getRepo('asset');
    const genAssetRepo = this.repoFactory.getRepo('generationAsset');
    const trigRepo = this.repoFactory.getRepo('trigger');
    const trigActRepo = this.repoFactory.getRepo('triggerAction');
    const ataRepo = this.repoFactory.getRepo('assetTriggerAction');
    const tjrRepo = this.repoFactory.getRepo('teamJobReservation');
    const tmAvailRepo = this.repoFactory.getRepo('teamJobReservation');

    const repos: CoreSharepointRepo<any>[] = [
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

  /**
   * Declare this here instead directly on the entity manager
   * so that we can filter by the targeted Sharepoint Feature entitylist
   * i.e. Aagt entities instead of all known entities.
   */

  createNewEntity<T extends SharepointAagtEntityList['shortname']>(
    entityType: T,
    defaultProps?: Partial<SelectedEntityKind<T>>
  ): SelectedEntityKind<T> {
    /**
     * Similar code as the createChild method located on the
     * base Sharepoint entity model, with the exception of not looking
     * for children entities of a given type.
     */
    const em = this.entityManager;
    // creates and attaches itself to the current em;

    // Need to fix the naming of the entityType. Breezejs expects PascalCase;
    entityType = _l.upperFirst(entityType) as any;
    const props = Object.assign({}, defaultProps);
    const newEntity = em.createEntity(entityType, props);
    return (newEntity as any) as SelectedEntityKind<T>;
  }

  flattenGenerationTask(generation: Generation): IAtaData {
    const genAssets = _l.sortBy(generation.generationAssets, x => x.mxPosition);
    const taskData = {} as IAtaData;
    taskData.tasks = [];
    taskData.projectStart = generation.genStartDate;

    let projectEnd: Date;

    for (const genAsset of genAssets) {
      const task = {} as IAtasGantt;
      const atasForAsset = generation.prioritizedATAs.filter(
        pata => pata.generationAsset.id === genAsset.id
      );
      let previousId: number;
      task.id = genAsset.id;
      task.startDate = atasForAsset[0].plannedStart;
      task.endDate = atasForAsset[atasForAsset.length - 1].plannedStop;
      task.name = genAsset.asset.alias;
      task.subtasks = atasForAsset.map(
        (ata: AssetTriggerAction, index: number) => {
          let pred: string;

          if (!projectEnd || ata.plannedStop > projectEnd) {
            projectEnd = ata.plannedStop;
          }

          if (index > 0 && !ata.isConcurrentable) {
            pred = Math.abs(task.id) + '' + Math.abs(previousId);
          }

          previousId = ata.id;

          const tId = Math.abs(task.id) + '' + Math.abs(ata.id);

          const projectTask = {
            id: +tId,
            startDate: ata.plannedStart,
            endDate: ata.plannedStop,
            name: ata.triggerAction.actionItem.action,
            triggerMilestone: ata.triggerAction.trigger.milestone,
            taskId: ata.id,
            duration: ata.triggerAction.actionItem.duration,
            predecessor: isNaN(+pred) ? undefined : +pred
          } as IAtasGantt;

          console.log(projectTask);
          return projectTask;
        }
      );

      taskData.tasks.push(task);
    }

    taskData.projectEnd = projectEnd;
    return taskData;
  }

  /**
   * Use to update the cached list of Action Item Resource
   * Categories to support the Action Item Detail
   * Component
   */
  getAllActionItemCategories(): string[] {
    const repo = this.repoFactory.getRepo('actionItemResource');
    const cached = repo.spChoiceFields('resourceCategory', true);
    return cached[1];
  }

  async getallActionItemByCategory(
    category: string
  ): Promise<Array<ActionItem | ActionItemResource>> {
    this.entityManager.isSaving.next(true);
    const actionItemRepo = this.repoFactory.getRepo('actionItem');
    const actionItemResourceRepo = this.repoFactory.getRepo(
      'actionItemResource'
    );
    const aiPredicate = actionItemRepo.makePredicate(
      'resourceCategory',
      category
    );
    const airPredicate = actionItemResourceRepo.makePredicate(
      'resourceCategory',
      category
    );
    const response = await Promise.all([
      actionItemRepo.where(aiPredicate),
      actionItemResourceRepo.where(airPredicate)
    ]);
    const allItemsWithCategory = [...response[0], ...response[1]];
    return allItemsWithCategory;
  }

  saveUnitOfWork(entities: SharepointEntity[]): Promise<SaveResult> {
    return this.entityManager.saveChanges(entities as any).finally(() => {
      this.entityManager.isSaving.next(false);
    });
  }

  async updateResourceCategories(options: string[]): Promise<string[]> {
    const repo = this.repoFactory.getRepo('actionItemResource');
    const newOptions = await repo.updateSpChoiceFields(
      'resourceCategory',
      options
    );
    return newOptions;
  }
}
