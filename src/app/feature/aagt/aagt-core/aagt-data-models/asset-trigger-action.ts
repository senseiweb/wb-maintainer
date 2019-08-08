import {
  SharepointEntity,
  BzEntity,
  BzEntityProp,
  BzEntityInitializer
} from 'app/core';
import * as _l from 'lodash';
import { Generation } from './generation';
import { GenerationAsset } from './generation-asset';
import { Team } from './team';
import { TeamJobReservation } from './team-job-reservation';
import { TriggerAction } from './trigger-action';

type AtaAllowedActionStatus =
  | 'unplanned'
  | 'planned'
  | 'unscheduled'
  | 'in-progress [on-time]'
  | 'in-progress [late]'
  | 'in-progress [early]'
  | 'scheduled'
  | 'rescheduled'
  | 'delayed';

type AtaAllowedOutcomes =
  | 'PCW'
  | 'completed [on-time]'
  | 'completed [early]'
  | 'completed [late]'
  | 'blamed'
  | 'untouched';

@BzEntity()
export class AssetTriggerAction extends SharepointEntity {
  readonly shortname = 'assetTriggerAction';

  /**
   * When used, indicates that child entity will be deleted
   * during the next save operation. Prefer to use this method
   * when entities may be deleted and restored several times
   * before actual saving is done to store.
   *
   * Used instead of Breeze internal setDeleted() method becuase
   * setDeleted() assume the entity will not longer be reference, '
   * which cases all child and parent references to this entity
   * be dropped and a pain in the butt to be recovered later.
   */
  isSoftDeleted?: boolean;

  @BzEntityProp('data')
  title: string;

  @BzEntityProp('data')
  sequence: number;

  @BzEntityProp('data', {
    dataCfg: {
      isNullable: false
    },
    spInternalName: 'Status'
  })
  actionStatus: AtaAllowedActionStatus;

  @BzEntityProp('data')
  outcome: AtaAllowedOutcomes;

  @BzEntityProp('data')
  plannedStart: Date;

  @BzEntityProp('data')
  plannedStop: Date;

  @BzEntityProp('data')
  scheduledStart: Date;

  @BzEntityProp('data')
  scheduledStop: Date;

  @BzEntityProp('data', {
    spInternalName: 'StartDate'
  })
  actualStart: Date;

  @BzEntityProp('data', {
    spInternalName: 'DueDate'
  })
  actualStop: Date;

  completedByTeamId: number;

  completedByTeam?: Team;

  @BzEntityProp('data')
  generationAssetId: number;

  @BzEntityProp('data')
  triggerActionId: number;

  @BzEntityProp('data')
  isConcurrentable: boolean;

  @BzEntityProp('nav', {
    relativeEntity: 'generationAsset',
    navCfg: { isScalar: true }
  })
  generationAsset: GenerationAsset;

  @BzEntityProp('nav', {
    relativeEntity: 'triggerAction',
    navCfg: { isScalar: true }
  })
  triggerAction: TriggerAction;

  @BzEntityProp('nav', {
    relativeEntity: 'teamJobReservation'
  })
  teamJobReservations: TeamJobReservation[];

  get predecessors(): AssetTriggerAction[] {
    if (!this.generationAsset) {
      return [];
    }
    const sortedAtas = this.generationAsset.generation.prioritizedATAs;
    const idx = sortedAtas.findIndex(ata => ata.id === this.id);
    return sortedAtas.filter((_, index) => index < idx);
  }

  get directPredecessor(): AssetTriggerAction {
    return this.predecessors.pop();
  }

  /**
   * Typically not recommded to put multiple ancestiral refernces
   * on the same entity, i.e. parent, grandparent, or great
   * grand parent, however,  querying deep entity graphs sucks in
   * sharepoint, so put a reference here to the top level
   * generations to simplify querying
   */
  @BzEntityProp('data')
  generationId: number;

  @BzEntityProp('nav', {
    relativeEntity: 'generation',
    navCfg: {
      isScalar: true
    }
  })
  generation: Generation;

  @BzEntityInitializer
  protected initializer(entity: this) {
    entity.outcome = entity.outcome || 'untouched';
    entity.actionStatus = entity.actionStatus || 'unplanned';
    entity.title =
      entity.title ||
      `Generation: ${entity.generationAsset.generation.title} |
             Trigger: ${entity.triggerAction.trigger.milestone} |
             Action: ${entity.triggerAction.actionItem.action}`;
    entity.generationId =
      entity.generationId || entity.generationAsset.generationId;
  }
}
