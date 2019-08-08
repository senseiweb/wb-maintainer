import { SharepointEntity, BzEntity, BzEntityProp } from 'app/core';
import { TeamCategory } from './team-category';
import { TriggerAction } from './trigger-action';

@BzEntity()
export class ActionItem extends SharepointEntity {
  readonly shortname = 'actionItem';

  @BzEntityProp('data', {
    dataCfg: {
      isNullable: false
    },
    spInternalName: 'Title'
  })
  action: string;

  @BzEntityProp('data')
  shortCode: string;

  @BzEntityProp('data')
  duration: number;

  @BzEntityProp('data')
  teamCategoryId: number;

  @BzEntityProp('nav', {
    relativeEntity: 'teamCategory',
    navCfg: { isScalar: true }
  })
  teamCategory: TeamCategory;

  @BzEntityProp('data', {})
  assignable: boolean;

  // @BzDataProp()
  notes: string;

  @BzEntityProp('nav', {
    relativeEntity: 'triggerAction'
  })
  actionTriggers: TriggerAction[];
}
