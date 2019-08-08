import { SharepointEntity, BzEntity, BzEntityProp } from 'app/core';
import * as _ from 'lodash';
import * as _m from 'moment';
import { Generation } from './generation';
import { Team } from './team';
import { TeamJobReservation } from './team-job-reservation';

@BzEntity()
export class TeamAvailability extends SharepointEntity {
  readonly shortname = 'teamAvailability';

  @BzEntityProp('data', {
    spInternalName: 'Title'
  })
  availabilityTitle: string;

  get isFullyBooked(): boolean {
    const availShiftTime = _m.duration(this.manHoursAvail, 'minutes');
    return availShiftTime.subtract(this.totalReservation).asHours() <= 1;
  }

  get totalReservation(): _m.Duration {
    const totalJobTime = _m.duration(0);
    if (!this.teamJobReservations) {
      return _m.duration(0);
    }
    this.teamJobReservations.forEach(jr => {
      const jobStart = _m(jr.reservationStart);
      const jobEnd = _m(jr.reservationEnd);
      totalJobTime.add(_m.duration(jobEnd.diff(jobStart)));
    });

    return totalJobTime;
  }

  @BzEntityProp('data', {
    dataCfg: { isNullable: false }
  })
  teamId: number;

  @BzEntityProp('data')
  availStart: Date;

  @BzEntityProp('data')
  availEnd: Date;

  @BzEntityProp('data')
  manHoursAvail: number;

  /**
   * Originally consider this entity as existing outside
   * a given generation; however, it makes harder to
   * know which team Avails to query. Additionally,
   * attaching it to a given generation allows for
   * mutliple generation to have the same availability,
   */

  @BzEntityProp('data')
  generationId: number;

  @BzEntityProp('nav', {
    relativeEntity: 'team',
    navCfg: {
      isScalar: true
    }
  })
  team: Team;

  @BzEntityProp('nav', {
    relativeEntity: 'teamJobReservation'
  })
  teamJobReservations: TeamJobReservation[];

  @BzEntityProp('nav', {
    relativeEntity: 'generation',
    navCfg: {
      isScalar: true
    }
  })
  generation: Generation;

  durationFromStart = (start: _m.Moment): number => {
    const availStart = _m(this.availStart);
    return _m
      .duration(availStart.diff(start))
      .abs()
      .asMinutes();
  };
}
