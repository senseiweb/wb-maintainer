import { SharepointEntity, BzEntity, BzEntityProp } from 'app/core';

@BzEntity()
export class ActionItemResource extends SharepointEntity {
  readonly shortname = 'actionItemResource';

  @BzEntityProp('data', {
    spInternalName: 'Title'
  })
  callSign: string;

  /**
   * A sharepoint multivalue column, new items will
   * need to be added in sharepoint.
   */
  @BzEntityProp('data', {
    dataCfg: {
      isNullable: false
    }
  })
  resourceCategory: string;

  @BzEntityProp('data')
  perItemCount: number;

  @BzEntityProp('data')
  notes: string;
}
