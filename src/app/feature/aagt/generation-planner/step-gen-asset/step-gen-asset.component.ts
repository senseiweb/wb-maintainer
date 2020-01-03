import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from "@angular/core";
import { fuseAnimations } from "@fuse/animations";
import { FormGroup, FormControl, FormBuilder } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { PlanGenResolvedData } from "../gen-planner-resolver.service";
import {
  Generation,
  GenerationAsset,
  Asset,
  GenStatusEnum
} from "../../aagt-core";
import { RawEntity, AppFormGroup, IAppFormGroup } from "@app_types";
import * as _m from "moment";
import * as _l from "lodash";
import Swal, { SweetAlertOptions } from "sweetalert2";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { FuseThemeOptionsModule } from "@fuse/components";

type GenModelProps = Pick<
  Generation,
  "title" | "assignedAssetCount" | "iso" | "genStartDate" | "genStatus"
>;
type GenFormModel = { [key in keyof GenModelProps]: FormControl };

@Component({
  selector: "app-plan-gen-asset",
  templateUrl: "./step-gen-asset.component.html",
  styleUrls: ["./step-gen-asset.component.scss"],
  animations: fuseAnimations,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlanGenAssetComponent implements OnInit {
  allIsos: string[];
  assignedAssets: GenerationAsset[];
  currentGen: Generation;
  genFormGroup: IAppFormGroup<GenFormModel>;
  minDate = new Date();
  statusEnum = Object.keys(GenStatusEnum);
  unassignedAssets: Asset[];

  private formModelProps: Array<keyof GenModelProps> = [
    "title",
    "assignedAssetCount",
    "iso",
    "genStartDate",
    "genStatus"
  ];

  constructor(
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const genRouteData = this.route.snapshot.data
      .generation as PlanGenResolvedData;

    this.allIsos = genRouteData[3][1];

    this.currentGen = genRouteData[0];

    this.unassignedAssets = _l.differenceWith(
      genRouteData[1],
      this.currentGen.generationAssets,
      (a: Asset, b: GenerationAsset) => a.id === b.assetId
    );
    this.unassignedAssets = this.unassignedAssets.concat([
      ...this.unassignedAssets
    ]);
    this.unassignedAssets = this.unassignedAssets.concat([
      ...this.unassignedAssets
    ]);
    this.unassignedAssets = this.unassignedAssets.concat([
      ...this.unassignedAssets
    ]);
    this.unassignedAssets = this.unassignedAssets.concat([
      ...this.unassignedAssets
    ]);

    /**
     * Make a copy of the generation assets because breeze js
     * handles entity arrays differently from vanilla javascript
     * array...which we do not want during add/remove operations
     * because item position in the array matters.
     */
    this.assignedAssets = [...this.currentGen.generationAssets];

    this.createFormGroupAndValidators();
  }

  changeStep(): void {
    console.log("gen Asset step changed");
    this.formModelProps.forEach(genProp => {
      const formValue = this.genFormGroup.get(genProp).value;
      const currProp = this.currentGen[genProp];

      if (currProp !== formValue) {
        this.currentGen[genProp as any] = formValue;
      }
    });
  }

  createFormGroupAndValidators(): void {
    const gen = this.currentGen;
    const formModel: Partial<GenFormModel> = {};

    const formValidators = gen.entityType.custom.formValidators;

    this.formModelProps.forEach(prop => {
      formModel[prop] = new FormControl(
        this.currentGen[prop],
        formValidators && formValidators.propVal.get(prop)
      );
    });

    this.genFormGroup = this.formBuilder.group(formModel) as any;

    /** Disable the asset count as it is updated by the selection of assets */
    formModel.assignedAssetCount.disable({
      onlySelf: true,
      emitEvent: false
    });
  }

  dropOnGenAsset($event: CdkDragDrop<Asset, GenerationAsset>): void {
    const asset = $event.item.data as Asset | GenerationAsset;

    // Are we resorting the assigned assets?
    if ($event.container.id === $event.previousContainer.id) {
      // Did we drop the item on the same spot?
      if ($event.currentIndex === $event.previousIndex) {
        return;
      }

      moveItemInArray(
        this.assignedAssets,
        $event.previousIndex,
        $event.currentIndex
      );

      this.sortGenAsset();
      return;
    }

    const addedGenAsset = this.currentGen.createChild("generationAsset", {
      assetId: asset.id
    });

    this.assignedAssets.splice($event.currentIndex, 0, addedGenAsset);
    this.sortGenAsset();

    this.unassignedAssets = this.unassignedAssets.filter(
      ast => ast.id !== asset.id
    );
  }

  sortGenAsset(): void {
    const numOfGenAssets = this.assignedAssets.length;

    for (let idx = 0; idx < numOfGenAssets; idx++) {
      const genAsset = this.assignedAssets[idx];
      const shouldBeInPosition = idx + 1;
      if (genAsset.mxPosition !== shouldBeInPosition) {
        genAsset.mxPosition = shouldBeInPosition;
      }
    }

    this.genFormGroup.controls.assignedAssetCount.setValue(
      this.assignedAssets.length,
      { onlySelf: true, emitEvent: false }
    );

    this.cdRef.markForCheck();
  }

  async droppedOnAsset($event: CdkDragDrop<Asset>): Promise<void> {
    if ($event.container.id === $event.previousContainer.id) {
      return;
    }

    const genAsset = $event.item.data as GenerationAsset;

    const config: SweetAlertOptions = {
      title: "Remove Asset?",
      text: `Are you sure?\n
      This will delete all tasks assigned to this asset for this generation. `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, remove asset!"
    };

    const result = await Swal.fire(config);

    if (result.value) {
      this.unassignedAssets.push(genAsset.asset);
      this.assignedAssets = this.assignedAssets.filter(
        genAst => genAst.assetId !== genAsset.assetId
      );

      this.sortGenAsset();

      // genAsset.assetTriggerActions
      //   .filter(ata => ata.generationAssetId === ata.id)
      //   .forEach(ata => ata.entityAspect.setDeleted());

      genAsset.entityAspect.setDeleted();

      Swal.fire("Asset Removed", "Asset and all tasks were removed", "success");
    }

    console.log(result);

    return result.value;
  }

  sortAssignedAsset(): void {}

  updateGenData(): void {
    for (const prop of this.formModelProps) {
      if (this.currentGen[prop] !== this.genFormGroup.get(prop).value) {
        this.currentGen[prop as any] = this.genFormGroup.get(prop).value;
      }
    }
    this.genFormGroup.markAsPristine();
  }
}
