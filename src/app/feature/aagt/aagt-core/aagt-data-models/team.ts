import { SharepointEntity, BzEntity, BzEntityProp } from 'app/core';
import * as _ from 'lodash';
import * as _m from 'moment';
import { TeamAvailability } from './team-availability';
import { TeamCategory } from './team-category';

@BzEntity()
export class Team extends SharepointEntity {
  readonly shortname = 'team';

  /** Tuple to hold the memorized time calculation */
  totalAvailDuringGen: [string, number];

  @BzEntityProp('data', { spInternalName: 'Title' })
  teamName: string;

  @BzEntityProp('data')
  teamCategoryId: number;

  @BzEntityProp('data')
  numTeamMembers: number;

  @BzEntityProp('data')
  notes: string;

  @BzEntityProp('nav', {
    relativeEntity: 'teamAvailability'
  })
  teamAvailabilites: TeamAvailability[];

  calTotalAvailDuringGen = (start: Date): number => {
    let teamAvails = 0;

    if (!start || !this.teamAvailabilites.length) {
      return 0;
    }
    const cachedKey = start.toString() + this.teamAvailabilites.join('|');

    if (this.totalAvailDuringGen && this.totalAvailDuringGen[0] === cachedKey) {
      return this.totalAvailDuringGen[1];
    }

    console.time('Cal team avails');
    this.teamAvailabilites
      .filter(ta => _m(ta.availStart).isSameOrAfter(start, 'h'))
      .forEach(avail => {
        teamAvails += _m(avail.availEnd).diff(avail.availStart, 'minute');
      });

    console.timeEnd('Cal team avails');

    this.totalAvailDuringGen = [cachedKey, teamAvails];
    return this.totalAvailDuringGen[1];
  };
}
