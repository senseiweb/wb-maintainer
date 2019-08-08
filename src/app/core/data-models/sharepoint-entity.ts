import {
  SharepointEntityList,
  SelectedEntityKind,
  EntityChildShortName
} from '@app_types/entity-extension';
import { SharepointMetadata } from './sharepoint-metadata';
import * as _l from 'lodash';
import { BzEntityProp } from '../decorators/bz-entity-annotation/bz-entity-prop.decorator';
import { BreezeEntity } from './breeze-entity';

export abstract class SharepointEntity extends BreezeEntity {
  abstract readonly shortname: string;

  @BzEntityProp('data', {
    dataCfg: { isPartOfKey: true }
  })
  id?: number;

  @BzEntityProp('data')
  modified?: Date;

  @BzEntityProp('data')
  created?: Date;

  @BzEntityProp('data')
  authorId?: number;

  @BzEntityProp('data')
  editorId?: number;

  @BzEntityProp('data', {
    dataCfg: {
      isNullable: false,
      complexTypeName: '__metadata:#Global'
    }
  })
  // tslint:disable-next-line: variable-name
  __metadata?: SharepointMetadata;

  /**
   * Convientant method for creating child entities for a
   * given parenet.
   */
  createChild = <TChild extends EntityChildShortName<this>>(
    childType: TChild,
    defaultProps?: Partial<SelectedEntityKind<TChild>>
  ): SelectedEntityKind<TChild> => {
    const em = this.entityAspect.entityManager;
    // creates and attaches itself to the current em;
    const props = {};
    props[_l.camelCase(this.shortname)] = this;
    childType = _l.upperFirst(childType) as any;
    Object.assign(props, defaultProps || {});
    const newEntity = em.createEntity(childType, props);
    return (newEntity as any) as SelectedEntityKind<TChild>;
  };
}
