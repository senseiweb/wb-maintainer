import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
  ViewEncapsulation
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { FusePerfectScrollbarDirective } from '@fuse/directives/fuse-perfect-scrollbar/fuse-perfect-scrollbar.directive';

@Component({
  selector: 'app-chat-panel',
  templateUrl: './chat-panel.component.html',
  styleUrls: ['./chat-panel.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ChatPanelComponent implements OnInit, AfterViewInit, OnDestroy {
  contacts: any[];
  chat: any;
  selectedContact: any;
  sidebarFolded: boolean;
  user: any;

  @ViewChild('replyForm', { static: false })
  private replyForm: NgForm;

  @ViewChild('replyInput', { static: false })
  private replyInput: ElementRef;

  @ViewChildren(FusePerfectScrollbarDirective)
  private fusePerfectScrollbarDirectives: QueryList<
    FusePerfectScrollbarDirective
  >;

  private chatViewScrollbar: FusePerfectScrollbarDirective;
  private unsubscribeAll: Subject<any>;

  constructor(
    private httpClient: HttpClient,
    private fuseSidebarService: FuseSidebarService
  ) {
    // Set the defaults
    this.selectedContact = null;
    this.sidebarFolded = true;

    // Set the private defaults
    this.unsubscribeAll = new Subject();
  }

  /**
   * On init
   */
  ngOnInit(): void {
    // Load the contacts
    // this.chatPanelService.loadContacts().then(() => {
    //   this.contacts = this.chatPanelService.contacts;
    //   this.user = this.chatPanelService.user;
    // });

    // Subscribe to the foldedChanged observable
    this.fuseSidebarService
      .getSidebar('chatPanel')
      .foldedChanged.pipe(takeUntil(this.unsubscribeAll))
      .subscribe(folded => {
        this.sidebarFolded = folded;
      });
  }

  /**
   * After view init
   */
  ngAfterViewInit(): void {
    this.chatViewScrollbar = this.fusePerfectScrollbarDirectives.find(
      directive => {
        return directive.elementRef.nativeElement.id === 'messages';
      }
    );
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  /**
   * Prepare the chat for the replies
   */
  private prepareChatForReplies(): void {
    setTimeout(() => {
      // Focus to the reply input
      // this._replyInput.nativeElement.focus();

      // Scroll to the bottom of the messages list
      if (this.chatViewScrollbar) {
        this.chatViewScrollbar.update();

        setTimeout(() => {
          this.chatViewScrollbar.scrollToBottom(0);
        });
      }
    });
  }

  /**
   * Fold the temporarily unfolded sidebar back
   */
  foldSidebarTemporarily(): void {
    this.fuseSidebarService.getSidebar('chatPanel').foldTemporarily();
  }

  /**
   * Unfold the sidebar temporarily
   */
  unfoldSidebarTemporarily(): void {
    this.fuseSidebarService.getSidebar('chatPanel').unfoldTemporarily();
  }

  toggleSidebarOpen(): void {
    this.fuseSidebarService.getSidebar('chatPanel').toggleOpen();
  }

  shouldShowContactAvatar(message, i): boolean {
    return (
      message.who === this.selectedContact.id &&
      ((this.chat.dialog[i + 1] &&
        this.chat.dialog[i + 1].who !== this.selectedContact.id) ||
        !this.chat.dialog[i + 1])
    );
  }

  isFirstMessageOfGroup(message, i): boolean {
    return (
      i === 0 ||
      (this.chat.dialog[i - 1] && this.chat.dialog[i - 1].who !== message.who)
    );
  }

  isLastMessageOfGroup(message, i): boolean {
    return (
      i === this.chat.dialog.length - 1 ||
      (this.chat.dialog[i + 1] && this.chat.dialog[i + 1].who !== message.who)
    );
  }

  /**
   * Toggle chat with the contact
   */
  toggleChat(contact): void {
    // If the contact equals to the selectedContact,
    // that means we will deselect the contact and
    // unload the chat
    if (this.selectedContact && contact.id === this.selectedContact.id) {
      // Reset
      this.resetChat();
    } else {
      // Unfold the sidebar temporarily
      this.unfoldSidebarTemporarily();

      // Set the selected contact
      this.selectedContact = contact;

      // Load the chat
      // this.chatPanelService.getChat(contact.id).then(chat => {
      //   // Set the chat
      //   this.chat = chat;

      //   // Prepare the chat for the replies
      //   this.prepareChatForReplies();
      // });
    }
  }

  /**
   * Remove the selected contact and unload the chat
   */
  resetChat(): void {
    // Set the selected contact as null
    this.selectedContact = null;

    // Set the chat as null
    this.chat = null;
  }

  /**
   * Reply
   */
  reply(event): void {
    event.preventDefault();

    if (!this.replyForm.form.value.message) {
      return;
    }

    // Message
    const message = {
      who: this.user.id,
      message: this.replyForm.form.value.message,
      time: new Date().toISOString()
    };

    // Add the message to the chat
    this.chat.dialog.push(message);

    // Reset the reply form
    this.replyForm.reset();

    // // Update the server
    // this.chatPanelService
    //   .updateChat(this.chat.id, this.chat.dialog)
    //   .then(response => {
    //     // Prepare the chat for the replies
    //     this.prepareChatForReplies();
    //   });
  }
}
