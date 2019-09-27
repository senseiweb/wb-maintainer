import { SharepointEntity, BzEntity, BzEntityProp } from 'app/core';
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

  @BzEntityProp('data', {
    dataCfg: {
      isNullable: false
    }
  })
  resourceCategory: string;

  @BzEntityProp('data', {})
  assignable: boolean;

  // @BzDataProp()
  notes: string;

  @BzEntityProp('nav', {
    relativeEntity: 'triggerAction'
  })
  actionTriggers: TriggerAction[];
}
