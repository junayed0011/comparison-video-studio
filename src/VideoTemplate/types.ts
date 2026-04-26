import { ThemeConfig } from '../lib/themes';

export interface ComparisonItem {
	id: string;
	country: string;
	flagUrl: string;
	itemName: string;
	imageUrl: string;
	color: string;
	value?: string | number;
	extraData?: Record<string, string | number>;
	overrides?: {
		cardShape?: 'rectangle' | 'rounded' | 'pill';
		cardWidth?: number;
		cardMargin?: number;
		cardBorderColor?: string;
		cardBorderWidth?: number;
		cardBorderRadius?: number;
		cardShadow?: string;
		cardScale?: number;
		cardYOffset?: number;
		backgroundColor?: string;
		layers?: any[];
	};
}

export interface VideoProps {
	items: ComparisonItem[];
	title: string;
	theme?: string | ThemeConfig;
}
