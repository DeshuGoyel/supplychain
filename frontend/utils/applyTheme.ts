interface ThemeConfig {
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  headerText: string;
  footerText: string;
  removedBranding: boolean;
  customHelpCenterUrl?: string;
}

export const applyTheme = (theme: ThemeConfig): void => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Apply CSS variables
  root.style.setProperty('--brand-primary', theme.primaryColor);
  root.style.setProperty('--brand-secondary', theme.secondaryColor);
  root.style.setProperty('--brand-font', theme.fontFamily);

  // Update favicon if custom one is provided
  if (theme.faviconUrl) {
    updateFavicon(theme.faviconUrl);
  }

  // Update document title if custom header text is provided
  if (theme.headerText && theme.headerText !== 'Supply Chain Control') {
    document.title = theme.headerText;
  }
};

const updateFavicon = (faviconUrl: string): void => {
  const link: HTMLLinkElement = document.querySelector("link[rel~='icon']") || document.createElement('link');
  link.type = 'image/x-icon';
  link.rel = 'icon';
  link.href = faviconUrl;
  
  if (!document.querySelector("link[rel~='icon']")) {
    document.getElementsByTagName('head')[0].appendChild(link);
  }
};

export const resetTheme = (): void => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Reset to default colors
  root.style.setProperty('--brand-primary', '#3B82F6');
  root.style.setProperty('--brand-secondary', '#10B981');
  root.style.setProperty('--brand-font', 'Inter, sans-serif');
};
