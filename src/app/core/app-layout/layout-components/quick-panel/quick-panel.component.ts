import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-quick-panel',
  templateUrl: './quick-panel.component.html',
  styleUrls: ['./quick-panel.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class QuickPanelComponent implements OnInit, OnDestroy {
  date: Date;
  events: any[];
  notes: any[];
  settings: any;

  private unsubscribeAll: Subject<any>;

  constructor(private httpClient: HttpClient) {
    this.date = new Date();
    this.settings = {
      notify: true,
      cloud: false,
      retro: true
    };

    this.unsubscribeAll = new Subject();
  }

  /**
   * On init
   */
  ngOnInit(): void {
    // Subscribe to the events
    this.httpClient
      .get('api/quick-panel-events')
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe((response: any) => {
        this.events = response;
      });

    // Subscribe to the notes
    this.httpClient
      .get('api/quick-panel-notes')
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe((response: any) => {
        this.notes = response;
      });
  }

  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
