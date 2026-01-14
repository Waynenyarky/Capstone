import React, { createContext, useContext, useState, useEffect } from 'react';
import { ConfigProvider, theme } from 'antd';
import { useLocation } from 'react-router-dom';

const ThemeContext = createContext();

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};

export const THEMES = {
  DEFAULT: 'default',
  DARK: 'dark',
  DOCUMENT: 'document',
  BLOSSOM: 'blossom',
  SUNSET: 'sunset',
  ROYAL: 'royal',
};

const themeConfig = {
  [THEMES.DEFAULT]: {
    name: 'Default',
    config: {
      algorithm: theme.defaultAlgorithm,
      token: {
        fontFamily: 'Raleway, sans-serif',
        colorPrimary: '#001529', // Explicitly set Default theme to Navy
      },
    },
  },
  [THEMES.DARK]: {
    name: 'Dark',
    config: {
      algorithm: theme.darkAlgorithm,
      token: {
        fontFamily: "'Raleway', sans-serif",
        colorPrimary: '#177ddc', // Ant Design Dark Blue - Clearer on dark
        colorBgBase: '#141414', // Standard Dark Grey (Better for eyes than #000000)
        colorBgContainer: '#1f1f1f', // Lighter container
        colorBgLayout: '#000000', // Deep black for layout background
        colorTextBase: 'rgba(255, 255, 255, 0.85)', // High readability but not harsh
        colorBorder: '#303030',
      },
      components: {
        Layout: {
          headerBg: '#141414',
          bodyBg: '#000000',
          siderBg: '#141414',
        },
        Card: {
          colorBgContainer: '#1f1f1f', // Distinct card background
        },
        Table: {
          colorBgContainer: '#1f1f1f',
        },
        Menu: {
          darkItemBg: '#141414',
        }
      }
    },
  },
  [THEMES.DOCUMENT]: {
    name: 'Document',
    config: {
      algorithm: theme.defaultAlgorithm,
      token: {
        fontFamily: "'Raleway', sans-serif",
        colorPrimary: '#00B96B', // Custom Green
        colorBgLayout: '#E5F8F0', // Light green background
        colorBgContainer: '#ffffff',
        borderRadius: 0, // Sharp edges for document feel
        wireframe: true, // clearer borders
      },
      components: {
        Layout: {
          headerBg: '#E5F8F0',
          siderBg: '#E5F8F0',
        }
      }
    },
  },
  [THEMES.BLOSSOM]: {
    name: 'Blossom',
    config: {
      algorithm: theme.defaultAlgorithm,
      token: {
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        colorPrimary: '#eb2f96',
        colorBgLayout: '#fff0f6',
        colorBgContainer: '#ffffff',
        colorLink: '#eb2f96',
        borderRadius: 8, // Softer edges
      },
      components: {
        Layout: {
          headerBg: '#ffffff', // Clean header
        }
      }
    },
  },
  [THEMES.SUNSET]: {
    name: 'Sunset',
    config: {
      algorithm: theme.defaultAlgorithm,
      token: {
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        colorPrimary: '#fa541c', // Volcano
        colorBgLayout: '#fff2e8', // Light volcano background
        colorBgContainer: '#ffffff',
        colorLink: '#fa541c',
        borderRadius: 6,
      },
      components: {
        Layout: {
          headerBg: '#fff2e8',
          siderBg: '#fff2e8',
        }
      }
    },
  },
  [THEMES.ROYAL]: {
    name: 'Royal',
    config: {
      algorithm: theme.defaultAlgorithm,
      token: {
        fontFamily: "'Raleway', sans-serif",
        colorPrimary: '#722ed1', // Purple
        colorBgLayout: '#f9f0ff', // Light purple background
        colorBgContainer: '#ffffff',
        colorLink: '#722ed1',
        borderRadius: 12,
      },
      components: {
        Layout: {
          headerBg: '#f9f0ff',
          siderBg: '#f9f0ff',
        }
      }
    },
  },
};

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem('app_theme');
    return Object.values(THEMES).includes(saved) ? saved : THEMES.DEFAULT;
  });

  // Preview theme allows showing a theme temporarily without persisting it (e.g. on hover)
  const [previewTheme, setPreviewTheme] = useState(null);
  const [previewOverrides, setPreviewOverrides] = useState(null);
  
  const location = useLocation();
  const PUBLIC_PATHS = ['/', '/login', '/sign-up', '/forgot-password', '/terms', '/privacy'];
  const isPublicPage = PUBLIC_PATHS.includes(location.pathname);

  // The theme to actually render
  const displayTheme = isPublicPage ? THEMES.DEFAULT : (previewTheme || currentTheme);

  // Store custom theme overrides (primary color, border radius, etc.)
  const [themeOverrides, setThemeOverrides] = useState(() => {
    try {
      const saved = localStorage.getItem('theme_overrides');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Derived overrides: disable overrides on public pages
  // If previewOverrides is set, use it instead of saved themeOverrides
  const activeOverrides = isPublicPage ? {} : (previewOverrides || themeOverrides);

  useEffect(() => {
    localStorage.setItem('app_theme', currentTheme);
    localStorage.setItem('theme_overrides', JSON.stringify(themeOverrides));
  }, [currentTheme, themeOverrides]);

  useEffect(() => {
    // Update global CSS variables for fonts and colors to match the selected theme
    const themeData = themeConfig[displayTheme];
    // Merge base token with overrides
    const token = { ...themeData.config.token, ...activeOverrides };
    const fontFamily = token.fontFamily;
    
    // Update fonts
    if (fontFamily) {
      document.documentElement.style.setProperty('--font-family', fontFamily);
      
      if (fontFamily.includes('Georgia')) {
         document.documentElement.style.setProperty('--heading-font-family', fontFamily);
      } else if (fontFamily.includes('Raleway')) {
         document.documentElement.style.setProperty('--heading-font-family', "'Raleway', sans-serif");
      } else {
         document.documentElement.style.setProperty('--heading-font-family', fontFamily);
      }
    }

    // Update global body background and text color
    // If specific colors are not defined in the theme token (like for Default/V4), fall back to standard light mode values
    const bodyBg = token.colorBgLayout || '#f0f2f5'; // Default AntD Layout bg
    const textColor = token.colorTextBase || '#1f1f1f'; // Default AntD text

    // Always use the theme's defined layout background for the global body background
    // This ensures consistency across all themes (Dark, Document, Blossom, etc.)
    document.documentElement.style.setProperty('--body-background', bodyBg);
    
    // For Dark theme specifically, we want the body to be pitch black to match the layout
    // if the token specifies it, otherwise fallback to the calculated bodyBg
    if (displayTheme === THEMES.DARK) {
       // Check if we have a specific bodyBg override in components
       const layoutBodyBg = themeData.config?.components?.Layout?.bodyBg;
       if (layoutBodyBg) {
           document.documentElement.style.setProperty('--body-background', layoutBodyBg);
       }
       document.documentElement.style.setProperty('--body-text', 'rgba(255, 255, 255, 0.85)');
    } else {
       // For light themes, ensure text is dark
       document.documentElement.style.setProperty('--body-text', '#1f1f1f');
    }

  }, [displayTheme, activeOverrides]);

  const updateThemeOverrides = (updates) => {
    setThemeOverrides(prev => ({ ...prev, ...updates }));
  };

  const value = {
    currentTheme: displayTheme, // Expose the displayed theme as currentTheme so consumers see the preview
    savedTheme: currentTheme,   // The actual saved theme (if needed)
    setTheme: setCurrentTheme,
    setPreviewTheme,            // Allow consumers to set preview
    themeOverrides,
    setThemeOverrides: updateThemeOverrides,
    replaceThemeOverrides: setThemeOverrides, // Allow complete replacement of overrides
    setPreviewOverrides,        // Allow consumers to preview overrides
    availableThemes: themeConfig,
  };

  // Merge base config with overrides
  const activeThemeConfig = themeConfig[displayTheme];
  
  // Logic to handle "Navy on Navy" visibility issue in Sidebar
  // If the user selects the Navy color (#001529) as primary, it matches the Default sidebar background.
  // We need to override the Menu component tokens to ensure the active state is visible.
  const effectivePrimary = activeOverrides.colorPrimary || activeThemeConfig.config.token.colorPrimary;
  const isNavyPrimary = effectivePrimary === '#001529';
  
  // Custom Menu overrides for Navy primary color
  const menuOverrides = isNavyPrimary ? {
    Menu: {
      // For Dark menu (sidebar), use a transparent white background instead of the primary color (which is navy and invisible)
      darkItemSelectedBg: 'rgba(255, 255, 255, 0.1)', 
      darkItemHoverBg: 'rgba(255, 255, 255, 0.05)',
      // Ensure text is white
      darkItemSelectedColor: '#ffffff',
      // For Light menu (if used elsewhere), we can keep standard behavior or tweak if needed
    }
  } : {};

  let algorithm = activeThemeConfig.config.algorithm;
  if (activeOverrides.compact) {
     if (Array.isArray(algorithm)) {
        algorithm = [...algorithm, theme.compactAlgorithm];
     } else {
        algorithm = [algorithm, theme.compactAlgorithm];
     }
  }

  const mergedConfig = {
    ...activeThemeConfig.config,
    algorithm,
    token: {
      ...activeThemeConfig.config.token,
      ...activeOverrides,
    },
    components: {
      ...activeThemeConfig.config.components,
      ...menuOverrides,
    }
  };

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider theme={mergedConfig}>
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}
