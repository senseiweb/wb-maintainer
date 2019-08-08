import { SharepointEntity } from 'app/core/data-models/sharepoint-entity';
import { SharepointMetadata } from 'app/core/data-models/sharepoint-metadata';
import { Instantiable } from '@app_types/helper';
import {
  IBzEntityDecArgs,
  IBzEntityDecorateArgs
} from '@app_types/entity-extension';
import { CustomNameConventionService } from 'app/core/data-access/breeze-providers/custom-name-convention.service';
import { MetadataStore } from 'breeze-client';
import { NewTypeForStore } from './entity-maker';
import { BreezeEntity } from 'app/core/data-models';

export function BzEntity<TClass extends Instantiable<BreezeEntity>>(
  entityProps?: IBzEntityDecArgs
) {
  return (constructor: TClass): void => {
    entityProps = entityProps || {};
    // TODO: check constructor name after uglify
    entityProps.shortName = (constructor as any).ENTITY_SHORTNAME =
      entityProps.shortName || constructor.name;

    class SpBzEntityDecorateArgs implements IBzEntityDecorateArgs {
      entityProps = entityProps || {};

      constructor() {}

      createTypeForStore = (
        store: MetadataStore,
        nameDictionaryService: CustomNameConventionService,
        namespace?: string
      ) => {
        entityProps.namespace = entityProps.namespace || namespace;
        return new NewTypeForStore(
          constructor as any,
          nameDictionaryService,
          store
        );
      };
    }

    if (!Object.getOwnPropertyDescriptor(constructor, 'spBzEntity')) {
      Object.defineProperty(constructor.prototype, 'spBzEntity', {
        enumerable: false,
        value: new SpBzEntityDecorateArgs(),
        writable: true,
        configurable: true
      });
    }
  };
}
