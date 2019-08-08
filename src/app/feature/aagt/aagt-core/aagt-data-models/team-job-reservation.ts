import {
  SharepointEntity,
  BzEntity,
  BzEntityProp,
  BreezeEntity,
  BzEntityInitializer
} from 'app/core';
import { AssetTriggerAction } from './asset-trigger-action';
import { Generation } from './generation';
import { TeamAvailability } from './team-availability';

/**
 * Entity to capture the relationship between Asset Trigger Action and
 * a available Team that is assigned to accomplish the the task.
 */
@BzEntity()
export class TeamJobReservation extends SharepointEntity {
  readonly shortname = 'teamJobReservation';

  @BzEntityProp('data')
  title: string;

  @BzEntityProp('data')
  teamAvailabilityId: number;

  @BzEntityProp('data')
  assetTriggerActionId: number;

  /**
   * Typically not recommded to put multiple ancestiral refernces
   * on the same entity, i.e. parent, grandparent, or great
   * grand parent, however,  querying deep entity graphs sucks in
   * sharepoint, so put a reference here to the top level
   * generations to simplify querying
   */
  @BzEntityProp('data')
  generationId: number;

  @BzEntityProp('data')
  reservationStart: Date;

  @BzEntityProp('data')
  reservationEnd: Date;

  @BzEntityProp('nav', {
    relativeEntity: 'assetTriggerAction',
    navCfg: { isScalar: true }
  })
  assetTriggerAction: AssetTriggerAction;

  @BzEntityProp('nav', {
    relativeEntity: 'generation',
    navCfg: { isScalar: true }
  })
  generation: Generation;

  @BzEntityProp('nav', {
    relativeEntity: 'teamAvailability',
    navCfg: { isScalar: true }
  })
  teamAvailability: TeamAvailability;

  @BzEntityInitializer
  protected intializer(entity: this): void {
    entity.title =
      entity.title ||
      `JobRes for Action: ${
        entity.assetTriggerAction.triggerAction.actionItem.action
      } | by Team: ${entity.teamAvailability.team.teamName}`;
  }
}
