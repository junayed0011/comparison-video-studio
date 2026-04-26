export interface CardLayer {
    id: string;
    type: 'country' | 'flag' | 'name' | 'image' | 'rank' | 'text' | 'shape';
    x: number; // % of card width
    y: number; // % of card height
    width: number; // % of card width
    height: number; // % of card height
    fontSize?: number;
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    textShadow?: string;
    boxShadow?: string;
    opacity?: number;
    zIndex: number;
    textFormat?: string; // for 'text', 'country', 'name'
    imageShape?: 'rectangle' | 'square' | 'circle' | 'pill'; // for 'image' and 'flag'
    objectFit?: 'cover' | 'contain';
}

export interface ThemeConfig {
    name: string;
    background: string;
    cardShape: 'rectangle' | 'rounded' | 'pill';
    cardBorderWidth: number;
    cardBorderColor: string;
    cardShadow: string;
    cardScale: number;
    cardYOffset: number;
    cardAnimation: 'none' | 'float' | 'pulse';
    fontFamily: string;
    titleColor: string;
    titleShadow: string;
    middleBarBg: string;
    middleBarTextColor: string;
    middleBarBorderWidth: number;
    middleBarBorderColor: string;
    middleBarHeight: number;
    middleBarTextShadow: string;
    imageBorderRadius: number;
    imageBorderWidth: number;
    imageBorderColor: string;
    imageShadow: string;
    cardWidth: number;
    cardMargin: number;
    cardPadding: number;
    headerHeight: number;
    headerFontSize: number;
    headerTextColor: string;
    headerTextShadow: string;
    middleBarFontSize: number;
    imagePadding: number;
    imageShape: 'rectangle' | 'square' | 'circle' | 'pill';
    textBadges?: any[]; // legacy
    layers?: CardLayer[];
}

export const themes: Record<string, ThemeConfig> = {
    auto: {
        name: 'Auto-Magic',
        background: '#222222',
        cardShape: 'rounded',
        cardBorderWidth: 8,
        cardBorderColor: '#000000',
        cardShadow: '0 20px 40px rgba(0,0,0,0.6)',
        cardScale: 1,
        cardYOffset: 0,
        cardAnimation: 'none',
        fontFamily: 'system-ui, sans-serif',
        titleColor: '#ffffff',
        titleShadow: '8px 8px 0px #1a49e0, 16px 16px 0px black',
        middleBarBg: '#1a49e0',
        middleBarTextColor: '#ffffff',
        middleBarBorderWidth: 5,
        middleBarBorderColor: '#000000',
        middleBarHeight: 140,
        middleBarTextShadow: '4px 4px 0px black',
        imageBorderRadius: 30,
        imageBorderWidth: 8,
        imageBorderColor: 'rgba(0,0,0,0.3)',
        imageShadow: '0 15px 35px rgba(0,0,0,0.4)',
        cardWidth: 480,
        cardMargin: 10,
        cardPadding: 20,
        headerHeight: 200,
        headerFontSize: 40,
        headerTextColor: '#ffffff',
        headerTextShadow: '3px 3px 0px black',
        middleBarFontSize: 45,
        imagePadding: 20,
        imageShape: 'rectangle',
        layers: [
            { id: 'l1', type: 'country', x: 50, y: 8, width: 80, height: 10, fontSize: 32, color: '#ffffff', textShadow: '2px 2px 0px black', zIndex: 1 },
            { id: 'l2', type: 'flag', x: 50, y: 18, width: 30, height: 12, imageShape: 'pill', zIndex: 1 },
            { id: 'l3', type: 'shape', x: 50, y: 32, width: 100, height: 14, backgroundColor: '#ff00ff', borderColor: '#000000', borderWidth: 4, zIndex: 0 },
            { id: 'l4', type: 'name', x: 50, y: 32, width: 90, height: 12, fontSize: 36, color: '#ffffff', textShadow: '2px 2px 0px black', zIndex: 1 },
            { id: 'l5', type: 'image', x: 50, y: 62, width: 85, height: 40, imageShape: 'rectangle', borderRadius: 20, borderWidth: 8, borderColor: 'rgba(0,0,0,0.3)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', zIndex: 1 },
            { id: 'l6', type: 'shape', x: 50, y: 90, width: 100, height: 14, backgroundColor: '#1a49e0', borderColor: '#000000', borderWidth: 4, zIndex: 0 },
            { id: 'l7', type: 'text', x: 50, y: 90, width: 90, height: 12, fontSize: 45, color: '#ffffff', textShadow: '3px 3px 0px black', textFormat: '{value}', zIndex: 1 }
        ]
    },
    cyberpunk: {
        name: 'Neon Cyberpunk',
        background: '#0f0c29',
        cardShape: 'rectangle',
        cardBorderWidth: 4,
        cardBorderColor: '#00ffff',
        cardShadow: '0 0 20px #0ff, inset 0 0 10px #0ff',
        cardScale: 1,
        cardYOffset: 0,
        cardAnimation: 'none',
        fontFamily: '"Courier New", Courier, monospace',
        titleColor: '#00ffff',
        titleShadow: '3px 3px 0px #f0f',
        middleBarBg: '#ff00ff',
        middleBarTextColor: '#ffffff',
        middleBarBorderWidth: 2,
        middleBarBorderColor: '#00ffff',
        middleBarHeight: 100,
        middleBarTextShadow: '3px 3px 0px black',
        imageBorderRadius: 0,
        imageBorderWidth: 4,
        imageBorderColor: '#00ffff',
        imageShadow: '0 0 15px #0ff',
        cardWidth: 380,
        cardMargin: 30,
        cardPadding: 15,
        headerHeight: 160,
        headerFontSize: 36,
        headerTextColor: '#ffffff',
        headerTextShadow: '3px 3px 0px #f0f',
        middleBarFontSize: 38,
        imagePadding: 20,
        imageShape: 'rectangle',
        layers: [
            { id: 'l1', type: 'country', x: 50, y: 8, width: 80, height: 8, fontSize: 36, color: '#ffffff', textShadow: '3px 3px 0px #f0f', zIndex: 1 },
            { id: 'l2', type: 'flag', x: 50, y: 20, width: 30, height: 15, imageShape: 'rectangle', zIndex: 1 },
            { id: 'l3', type: 'shape', x: 50, y: 38, width: 100, height: 12, backgroundColor: '#ff00ff', borderColor: '#00ffff', borderWidth: 2, zIndex: 0 },
            { id: 'l4', type: 'name', x: 50, y: 38, width: 90, height: 10, fontSize: 38, color: '#ffffff', textShadow: '3px 3px 0px black', zIndex: 1 },
            { id: 'l5', type: 'image', x: 50, y: 72, width: 90, height: 50, imageShape: 'rectangle', borderRadius: 0, borderWidth: 4, borderColor: '#00ffff', boxShadow: '0 0 15px #0ff', zIndex: 1 }
        ]
    },
    glassmorphism: {
        name: 'Glassmorphic Elegance',
        background: '#4facfe',
        cardShape: 'rounded',
        cardBorderWidth: 1,
        cardBorderColor: '#ffffff',
        cardShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        cardScale: 1,
        cardYOffset: 0,
        cardAnimation: 'none',
        fontFamily: '"Inter", sans-serif',
        titleColor: '#ffffff',
        titleShadow: '0 4px 10px rgba(0,0,0,0.2)',
        middleBarBg: '#ffffff',
        middleBarTextColor: '#333333',
        middleBarBorderWidth: 0,
        middleBarBorderColor: '#ffffff',
        middleBarHeight: 120,
        middleBarTextShadow: 'none',
        imageBorderRadius: 20,
        imageBorderWidth: 1,
        imageBorderColor: 'rgba(255,255,255,0.5)',
        imageShadow: '0 4px 15px rgba(0,0,0,0.1)',
        cardWidth: 420,
        cardMargin: 50,
        cardPadding: 30,
        headerHeight: 200,
        headerFontSize: 28,
        headerTextColor: '#ffffff',
        headerTextShadow: '0 2px 4px rgba(0,0,0,0.2)',
        middleBarFontSize: 45,
        imagePadding: 40,
        imageShape: 'rectangle',
        layers: [
            { id: 'l1', type: 'country', x: 50, y: 12, width: 80, height: 8, fontSize: 28, color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.2)', zIndex: 1 },
            { id: 'l2', type: 'flag', x: 50, y: 25, width: 30, height: 15, imageShape: 'rounded', zIndex: 1 },
            { id: 'l3', type: 'shape', x: 50, y: 42, width: 100, height: 12, backgroundColor: 'rgba(255,255,255,0.2)', borderColor: '#ffffff', borderWidth: 1, zIndex: 0 },
            { id: 'l4', type: 'name', x: 50, y: 42, width: 90, height: 10, fontSize: 45, color: '#333333', textShadow: 'none', zIndex: 1 },
            { id: 'l5', type: 'image', x: 50, y: 74, width: 80, height: 40, imageShape: 'rectangle', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', zIndex: 1 }
        ]
    },
    minimalist: {
        name: 'Minimalist Pop',
        background: '#f4f4f4',
        cardShape: 'pill',
        cardBorderWidth: 4,
        cardBorderColor: '#111111',
        cardShadow: '10px 10px 0px #111',
        cardScale: 1,
        cardYOffset: 0,
        cardAnimation: 'none',
        fontFamily: '"Helvetica Neue", Arial, sans-serif',
        titleColor: '#111111',
        titleShadow: 'none',
        middleBarBg: '#111111',
        middleBarTextColor: '#ffffff',
        middleBarBorderWidth: 0,
        middleBarBorderColor: '#000000',
        middleBarHeight: 110,
        middleBarTextShadow: 'none',
        imageBorderRadius: 10,
        imageBorderWidth: 4,
        imageBorderColor: '#111111',
        imageShadow: 'none',
        cardWidth: 400,
        cardMargin: 40,
        cardPadding: 20,
        headerHeight: 180,
        headerFontSize: 32,
        headerTextColor: '#111111',
        headerTextShadow: 'none',
        middleBarFontSize: 40,
        imagePadding: 30,
        imageShape: 'circle',
        layers: [
            { id: 'l1', type: 'country', x: 50, y: 12, width: 80, height: 8, fontSize: 32, color: '#111111', textShadow: 'none', zIndex: 1 },
            { id: 'l2', type: 'flag', x: 50, y: 25, width: 25, height: 15, imageShape: 'circle', zIndex: 1 },
            { id: 'l3', type: 'shape', x: 50, y: 42, width: 100, height: 12, backgroundColor: '#111111', borderColor: '#000000', borderWidth: 0, zIndex: 0 },
            { id: 'l4', type: 'name', x: 50, y: 42, width: 90, height: 10, fontSize: 40, color: '#ffffff', textShadow: 'none', zIndex: 1 },
            { id: 'l5', type: 'image', x: 50, y: 74, width: 70, height: 40, imageShape: 'circle', borderRadius: 10, borderWidth: 4, borderColor: '#111111', boxShadow: 'none', zIndex: 1 }
        ]
    }
};

export const getTheme = (themeNameOrConfig: string | ThemeConfig | undefined): ThemeConfig => {
    const defaultTheme = themes.auto;
    
    if (!themeNameOrConfig) return defaultTheme;
    
    if (typeof themeNameOrConfig === 'object') {
        // Deep merge logic to ensure all required properties exist
        return {
            ...defaultTheme,
            ...themeNameOrConfig,
            // Specifically ensure layers are handled if present but potentially empty
            layers: themeNameOrConfig.layers || defaultTheme.layers
        };
    }
    
    return themes[themeNameOrConfig] || defaultTheme;
};
