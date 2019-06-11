type FuseCustomLayoutName =
  | 'app-horizontal-layout-1'
  | 'app-vertical-layout-1'
  | 'app-vertical-layout-2'
  | 'app-vertical-layout-3';

type FuseNavVariantName =
  | 'app-navbar-horizontal-style-1'
  | 'app-navbar-vertical-style-1'
  | 'app-navbar-vertical-style-2';

export interface FuseConfig {
  colorTheme: string;
  customScrollbars: boolean;
  layout: {
    style: FuseCustomLayoutName;
    width: 'fullwidth' | 'boxed';
    navbar: {
      primaryBackground: string;
      secondaryBackground: string;
      hidden: boolean;
      folded: boolean;
      position: 'left' | 'right' | 'top';
      variant: FuseNavVariantName;
    };
    toolbar: {
      customBackgroundColor: boolean;
      background: string;
      hidden: boolean;
      position:
        | 'above'
        | 'above-static'
        | 'above-fixed'
        | 'below'
        | 'below-static'
        | 'below-fixed';
    };
    footer: {
      customBackgroundColor: boolean;
      background: string;
      hidden: boolean;
      position:
        | 'above'
        | 'above-static'
        | 'above-fixed'
        | 'below'
        | 'below-static'
        | 'below-fixed';
    };
    sidepanel: {
      hidden: boolean;
      position: 'left' | 'right';
    };
  };
}
