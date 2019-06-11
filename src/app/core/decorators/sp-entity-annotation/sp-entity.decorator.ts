import { SharepointEntity } from 'app/core/data-models/sharepoint-entity';
import { SharepointMetadata } from 'app/core/data-models/sharepoint-metadata';
import { Instantiable } from '@app_types/helper';
import {
  ISpEntityDecArgs,
  ISpBzEntityDecorateArgs
} from '@app_types/entity-extension';
import { CustomNameConventionService } from 'app/core/data-access/breeze-name-dictionary.service';
import { MetadataStore } from 'breeze-client';
import { NewTypeForStore } from './entity-maker';
import { MxmAppName, MxmAssignedModels } from 'app/core/data-access/data-utils';

export function SpEntity<
  TClass extends Instantiable<SharepointEntity | SharepointMetadata>
>(forAppNamed: MxmAppName | 'Global', entityProps: ISpEntityDecArgs) {
  return (constructor: TClass): void => {
    // TODO: check constructor name after uglify
    entityProps.shortName = (constructor as any).ENTITY_SHORTNAME =
      entityProps.shortName || constructor.name;

    class SpBzEntityDecorateArgs implements ISpBzEntityDecorateArgs {
      entityProps = entityProps;

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
      }
    }

    if (!Object.getOwnPropertyDescriptor(constructor, 'spBzEntity')) {
      Object.defineProperty(constructor.prototype, 'spBzEntity', {
        enumerable: false,
        value: new SpBzEntityDecorateArgs(),
        writable: true,
        configurable: true
      });
    }

    if (constructor.name !== 'SpEntityBase') {
      const modelCollection = MxmAssignedModels.has(forAppNamed)
        ? MxmAssignedModels.get(forAppNamed)
        : [];
      modelCollection.push(constructor as any);
      MxmAssignedModels.set(forAppNamed, modelCollection);
    }
  };
}
