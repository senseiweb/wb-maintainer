import { FuseConfig } from '@fuse/types';

export const defaultFuseConfig: FuseConfig = {
  colorTheme: 'theme-default',
  customScrollbars: true,
  layout: {
    style: 'app-vertical-layout-1',
    width: 'fullwidth',
    navbar: {
      primaryBackground: 'fuse-navy-700',
      secondaryBackground: 'fuse-navy-900',
      folded: false,
      hidden: false,
      position: 'left',
      variant: 'app-navbar-vertical-style-2'
    },
    toolbar: {
      customBackgroundColor: false,
      background: 'fuse-white-500',
      hidden: false,
      position: 'below-fixed'
    },
    footer: {
      customBackgroundColor: true,
      background: 'fuse-navy-900',
      hidden: false,
      position: 'below-fixed'
    },
    sidepanel: {
      hidden: false,
      position: 'right'
    }
  }
};
