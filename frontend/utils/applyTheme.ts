interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  logoUrl?: string;
  faviconUrl?: string;
}

export function applyTheme(config: ThemeConfig) {
  const root = document.documentElement;

  root.style.setProperty('--brand-primary', config.primaryColor);
  root.style.setProperty('--brand-secondary', config.secondaryColor);
  root.style.setProperty('--brand-font', config.fontFamily);

  document.body.style.fontFamily = config.fontFamily;

  if (config.faviconUrl) {
    updateFavicon(config.faviconUrl);
  }

  updateCSSVariables(config);
}

function updateFavicon(url: string) {
  const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
  if (link) {
    link.href = url;
  } else {
    const newLink = document.createElement('link');
    newLink.rel = 'icon';
    newLink.href = url;
    document.head.appendChild(newLink);
  }
}

function updateCSSVariables(config: ThemeConfig) {
  const root = document.documentElement;

  const primaryColor = config.primaryColor;
  const secondaryColor = config.secondaryColor;

  root.style.setProperty('--primary-50', adjustBrightness(primaryColor, 45));
  root.style.setProperty('--primary-100', adjustBrightness(primaryColor, 40));
  root.style.setProperty('--primary-200', adjustBrightness(primaryColor, 30));
  root.style.setProperty('--primary-300', adjustBrightness(primaryColor, 20));
  root.style.setProperty('--primary-400', adjustBrightness(primaryColor, 10));
  root.style.setProperty('--primary-500', primaryColor);
  root.style.setProperty('--primary-600', adjustBrightness(primaryColor, -10));
  root.style.setProperty('--primary-700', adjustBrightness(primaryColor, -20));
  root.style.setProperty('--primary-800', adjustBrightness(primaryColor, -30));
  root.style.setProperty('--primary-900', adjustBrightness(primaryColor, -40));

  root.style.setProperty('--secondary-50', adjustBrightness(secondaryColor, 45));
  root.style.setProperty('--secondary-100', adjustBrightness(secondaryColor, 40));
  root.style.setProperty('--secondary-200', adjustBrightness(secondaryColor, 30));
  root.style.setProperty('--secondary-300', adjustBrightness(secondaryColor, 20));
  root.style.setProperty('--secondary-400', adjustBrightness(secondaryColor, 10));
  root.style.setProperty('--secondary-500', secondaryColor);
  root.style.setProperty('--secondary-600', adjustBrightness(secondaryColor, -10));
  root.style.setProperty('--secondary-700', adjustBrightness(secondaryColor, -20));
  root.style.setProperty('--secondary-800', adjustBrightness(secondaryColor, -30));
  root.style.setProperty('--secondary-900', adjustBrightness(secondaryColor, -40));
}

function adjustBrightness(hex: string, amount: number): string {
  const color = hex.replace('#', '');
  const num = parseInt(color, 16);

  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));

  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export function removeTheme() {
  const root = document.documentElement;

  root.style.removeProperty('--brand-primary');
  root.style.removeProperty('--brand-secondary');
  root.style.removeProperty('--brand-font');
  root.style.removeProperty('--primary-50');
  root.style.removeProperty('--primary-500');
  root.style.removeProperty('--primary-900');
  root.style.removeProperty('--secondary-50');
  root.style.removeProperty('--secondary-500');
  root.style.removeProperty('--secondary-900');
}
