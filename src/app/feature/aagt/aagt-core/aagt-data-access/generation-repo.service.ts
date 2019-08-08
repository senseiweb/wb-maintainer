// import { Injectable, Inject } from '@angular/core';
// import { AagtCoreModule } from '../aagt-core.module';
// import { ENTITY_MANAGER, CoreSharepointRepo } from 'app/core';
// import {
//   Generation,
//   GenerationAsset,
//   Asset,
//   Trigger,
//   TriggerAction,
//   AssetTriggerAction,
//   TeamJobReservation,
//   TeamAvailability
// } from '../aagt-data-models';
// import { EntityManager, EntityQuery } from 'breeze-client';

// @Injectable({ providedIn: AagtCoreModule })
// export class GenerationRepoService extends CoreSharepointRepo<Generation> {
//   constructor(@Inject(ENTITY_MANAGER) entityManager: EntityManager) {
//     super('Generation', entityManager);
//   }

//   fetchGenerationGraph(id: number): Promise<any[]> {
//     const genAssetPredicate = this.makePredicate<GenerationAsset>(
//       'generationId',
//       id
//     );
//     const trigPredicate = this.makePredicate<Trigger>('generationId', id);

//     const trigActPredicate = this.makePredicate<TriggerAction>(
//       'generationId',
//       id
//     );
//     const ataPredicate = this.makePredicate<AssetTriggerAction>(
//       'generationId',
//       id
//     );
//     const tjrPredicate = this.makePredicate<TeamJobReservation>(
//       'generationId',
//       id
//     );
//     const tmAvailPredicate = this.makePredicate<TeamAvailability>(
//       'generationId',
//       id
//     );
//     const queries: EntityQuery[] = [
//       this.queryFromSp('GenerationAsset').where(genAssetPredicate),

//       this.queryFromSp('Trigger').where(trigPredicate),

//       this.queryFromSp('TriggerAction').where(trigActPredicate),

//       this.queryFromSp('AssetTriggerAction').where(ataPredicate),

//       this.queryFromSp('TeamJobReservation').where(tjrPredicate),

//       this.queryFromSp('TeamAvailability').where(tmAvailPredicate)
//     ];

//     return Promise.all(
//       queries.map(query => {
//         query.useSpBatchQuery = true;
//         this.executeQuery(query);
//       })
//     );
//   }
// }
