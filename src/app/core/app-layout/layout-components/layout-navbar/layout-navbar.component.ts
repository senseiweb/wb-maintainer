import { Component, ElementRef, Input, Renderer2, ViewEncapsulation } from '@angular/core';

@Component({
    selector     : 'app-layout-navbar',
    templateUrl  : './layout-navbar.component.html',
    styleUrls    : ['./layout-navbar.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class NavbarComponent
{
    private _variant: string;

    constructor(
        private elementRef: ElementRef,
        private renderer: Renderer2
    )
    {
        // Set the private defaults
        this._variant = 'vertical-style-1';
    }

    get variant(): string
    {
        return this._variant;
    }

    @Input()
    set variant(value: string)
    {
        // Remove the old class name
        this.renderer.removeClass(this.elementRef.nativeElement, this.variant);

        // Store the variant value
        this._variant = value;

        // Add the new class name
        this.renderer.addClass(this.elementRef.nativeElement, value);
    }
}
