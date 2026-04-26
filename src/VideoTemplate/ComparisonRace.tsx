import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {ComparisonCard} from './ComparisonCard';
import {ComparisonItem} from './types';
import {getTheme, ThemeConfig} from '../lib/themes';

export const ComparisonRace: React.FC<{items: ComparisonItem[]; title: string; theme?: string | ThemeConfig}> = ({items, title, theme}) => {
	const frame = useCurrentFrame();
	const {width, durationInFrames} = useVideoConfig();
	const activeTheme = getTheme(theme);

	// Calculate total width of the scroll dynamically
	const dynamicCardWidth = activeTheme.cardWidth + (activeTheme.cardMargin * 2);
	const totalWidth = items.length * dynamicCardWidth;

	// The offset moves from right to left
	// We start with the first card centered, or slightly off-screen
	// Corrected centering logic:
	// Start: First card centered in screen
	const startX = width / 2 - dynamicCardWidth / 2;
	// End: Last card centered in screen
	const endX = width / 2 - (items.length - 0.5) * dynamicCardWidth;

	const translateX = interpolate(
		frame,
		[0, durationInFrames],
		[startX, endX],
		{extrapolateRight: 'clamp'}
	);

	return (
		<AbsoluteFill style={{backgroundColor: '#111', display: 'flex', flexDirection: 'column'}}>
			{/* Dynamic Background */}
			<AbsoluteFill
				style={{
					background: activeTheme.background,
					opacity: 1,
					zIndex: -1
				}}
			/>

			{/* Header Section (Title) */}
			<div
				style={{
					height: 120,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					zIndex: 10,
					paddingTop: 10,
				}}
			>
				<h1
					style={{
						fontSize: 50,
						fontWeight: '900',
						fontFamily: activeTheme.fontFamily,
						color: activeTheme.titleColor,
						textAlign: 'center',
						textTransform: 'uppercase',
						textShadow: (activeTheme.titleShadow || 'none')
							.replace(/8px/g, '4px')
							.replace(/16px/g, '8px'),
						margin: 0,
					}}
				>
					{title}
				</h1>
			</div>

			{/* Scrolling Container Section */}
			<div
				style={{
					flex: 1,
					display: 'flex',
					flexDirection: 'row',
					alignItems: 'center',
					transform: `translateX(${translateX}px)`,
				}}
			>
				{items.map((item) => (
					<ComparisonCard key={item.id} item={item} theme={activeTheme} />
				))}
			</div>
		</AbsoluteFill>
	);
};
