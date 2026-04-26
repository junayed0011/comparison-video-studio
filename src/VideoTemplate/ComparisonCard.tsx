import React from 'react';
import {useCurrentFrame, Img, delayRender, continueRender} from 'remotion';
import {ComparisonItem} from './types';
import {ThemeConfig} from '../lib/themes';

const LayerComponent: React.FC<{layer: any; idx: number; item: ComparisonItem; onAssetLoad: () => void}> = ({layer, idx, item, onAssetLoad}) => {
	if (!layer) return null;
	
	const replaceTextFormat = (format: string, itm: ComparisonItem) => {
		let text = (format || '')
			.replace(/{country}/g, itm.country || '')
			.replace(/{itemName}/g, itm.itemName || '')
			.replace(/{value}/g, itm.value !== undefined && itm.value !== null ? itm.value.toString() : '');
		
		if (itm.extraData) {
			for (const [key, val] of Object.entries(itm.extraData)) {
				if (val !== undefined && val !== null) {
					text = text.replace(new RegExp(`{${key}}`, 'g'), val.toString());
				}
			}
		}
		return text;
	};

	const commonStyle: React.CSSProperties = {
		position: 'absolute',
		left: `${layer.x || 50}%`,
		top: `${layer.y || 50}%`,
		width: `${layer.width || 0}%`,
		height: `${layer.height || 0}%`,
		transform: 'translate(-50%, -50%)',
		zIndex: layer.zIndex || 0,
		opacity: layer.opacity ?? 1,
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		overflow: 'hidden',
	};

	switch (layer.type) {
		case 'country':
		case 'name':
		case 'rank':
		case 'text':
			const content = layer.type === 'country' ? item.country : 
					 layer.type === 'name' ? item.itemName : 
					 layer.type === 'rank' ? (item as any).rank : 
					 replaceTextFormat(layer.textFormat || '', item);
			
			if (!content) return null;

			return (
				<div key={layer.id || `layer-${idx}`} style={{
					...commonStyle,
					fontSize: layer.fontSize || 30,
					color: layer.color || '#ffffff',
					fontWeight: '900',
					textAlign: 'center',
					textTransform: 'uppercase',
					textShadow: layer.textShadow || 'none',
					whiteSpace: 'normal',
					lineHeight: 1.1,
					overflow: 'visible',
				}}>
					{content}
				</div>
			);

		case 'image':
		case 'flag':
			const initialUrl = layer.type === 'image' ? item.imageUrl : item.flagUrl;
			const [src, setSrc] = React.useState(initialUrl || '');
			const [hasError, setHasError] = React.useState(false);

			React.useEffect(() => {
				setSrc(initialUrl || '');
				setHasError(false);
			}, [initialUrl]);

			return (
				<div key={layer.id || `layer-${idx}`} style={{
					...commonStyle,
					borderRadius: layer.imageShape === 'circle' ? '50%' : layer.imageShape === 'pill' ? 1000 : layer.borderRadius || 0,
					border: `${layer.borderWidth || 0}px solid ${layer.borderColor || 'transparent'}`,
					boxShadow: layer.boxShadow || 'none',
					backgroundColor: layer.backgroundColor || (hasError ? 'rgba(255,255,255,0.1)' : 'transparent'),
				}}>
					{src && !hasError ? (
						<img 
							src={src} 
							onLoad={onAssetLoad}
							onError={() => {
								if (src && !src.includes('ui-avatars.com')) {
									setSrc(`https://ui-avatars.com/api/?name=${encodeURIComponent(item.itemName)}&background=random&color=fff&size=512`);
								} else {
									setHasError(true);
									onAssetLoad();
								}
							}} 
							style={{ 
								width: '100%', 
								height: '100%', 
								objectFit: layer.objectFit || 'cover',
								display: hasError ? 'none' : 'block'
							}} 
						/>
					) : (
						<div style={{ fontSize: 12, color: 'white', textAlign: 'center', padding: 10 }}>
							{layer.type.toUpperCase()}
						</div>
					)}
				</div>
			);

		case 'shape':
			return (
				<div key={layer.id} style={{
					...commonStyle,
					backgroundColor: layer.backgroundColor || '#ffffff',
					border: `${layer.borderWidth || 0}px solid ${layer.borderColor || 'transparent'}`,
					borderRadius: layer.borderRadius || 0,
					boxShadow: layer.boxShadow || 'none',
				}} />
			);

		default:
			return null;
	}
};

export const ComparisonCard: React.FC<{item: ComparisonItem; theme: ThemeConfig; isFullPage?: boolean}> = ({item, theme, isFullPage = false}) => {
	const [handle] = React.useState(() => delayRender('Loading assets...'));
	const [assetsLoaded, setAssetsLoaded] = React.useState(0);
	
	const layers = (item?.overrides?.layers || theme?.layers || []) as any[];
	const imageLayers = layers.filter(l => l?.type === 'image' || l?.type === 'flag');
	const totalAssets = imageLayers.length;

	React.useEffect(() => {
		if (totalAssets === 0 || assetsLoaded >= totalAssets) {
			try { continueRender(handle); } catch (e) {}
		}
		const timeout = setTimeout(() => {
			try { continueRender(handle); } catch (e) {}
		}, 3000);
		return () => clearTimeout(timeout);
	}, [assetsLoaded, handle, totalAssets]);

	const onAssetLoad = () => setAssetsLoaded(prev => prev + 1);

	let frame = 0;
	try {
		frame = useCurrentFrame();
	} catch (e) {}

	if (!item || !theme) {
		return (
			<div style={{
				width: isFullPage ? 1920 : theme.cardWidth, 
				height: isFullPage ? 1080 : '100%', 
				backgroundColor: '#000', 
				display: 'flex', alignItems: 'center', justifyContent: 'center', 
				color: 'white', fontSize: 50, fontFamily: 'sans-serif'
			}}>
				No Item Data
			</div>
		);
	}

	const overrides = item.overrides || {};
	let scale = overrides.cardScale ?? theme.cardScale ?? 1;
	let translateY = (overrides.cardYOffset ?? theme.cardYOffset ?? 0);

	if (theme.cardAnimation === 'float') {
		const offset = (item.country || '').length * 5;
		translateY += Math.sin((frame + offset) / 20) * 15;
	} else if (theme.cardAnimation === 'pulse') {
		const offset = (item.country || '').length * 5;
		scale *= 1 + Math.sin((frame + offset) / 15) * 0.05;
	}

	const replaceTextFormat = (format: string, itm: ComparisonItem) => {
		let text = (format || '')
			.replace(/{country}/g, itm.country || '')
			.replace(/{itemName}/g, itm.itemName || '')
			.replace(/{value}/g, itm.value !== undefined && itm.value !== null ? itm.value.toString() : '');
		
		if (itm.extraData) {
			for (const [key, val] of Object.entries(itm.extraData)) {
				if (val !== undefined && val !== null) {
					text = text.replace(new RegExp(`{${key}}`, 'g'), val.toString());
				}
			}
		}
		return text;
	};

	const currentShape = overrides.cardShape || theme.cardShape;
	const borderRadius = overrides.cardBorderRadius ?? (currentShape === 'pill' ? 1000 : currentShape === 'rounded' ? 30 : 0);

	return (
		<div style={{
			width: isFullPage ? 1920 : (overrides.cardWidth ?? theme.cardWidth ?? 480) + (theme.cardMargin * 2),
			height: isFullPage ? 1080 : '100%',
			backgroundColor: isFullPage ? (theme.background || '#000') : 'transparent',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			position: 'relative',
			overflow: 'hidden',
			flexShrink: 0,
		}}>
			<div
				style={{
					position: 'relative',
					width: overrides.cardWidth ?? theme.cardWidth ?? 480,
					height: '85%',
					backgroundColor: overrides.backgroundColor || item.color,
					borderRadius,
					boxShadow: overrides.cardShadow || theme.cardShadow,
					border: `${overrides.cardBorderWidth ?? theme.cardBorderWidth ?? 0}px solid ${overrides.cardBorderColor || theme.cardBorderColor || 'transparent'}`,
					overflow: 'hidden',
					fontFamily: theme.fontFamily,
					transform: `scale(${scale}) translateY(${translateY}px)`,
					display: 'flex',
					flexDirection: 'column'
				}}
			>
				{(overrides.layers || theme.layers) ? (
					(overrides.layers || theme.layers).map((layer: any, idx: number) => (
						<LayerComponent key={layer.id || idx} layer={layer} idx={idx} item={item} onAssetLoad={onAssetLoad} />
					))
				) : (
					<div style={{padding: 40, color: 'white', fontSize: 24, textAlign: 'center'}}>No Layers Configured</div>
				)}

				{/* Text Badges Overlays */}
				{!theme.layers && (theme.textBadges || []).map((badge: any) => (
					<div key={badge.id} style={{
						position: 'absolute',
						left: `${badge.x}%`,
						top: `${badge.y}%`,
						transform: 'translate(-50%, -50%)',
						backgroundColor: badge.backgroundColor,
						color: badge.textColor,
						fontSize: badge.fontSize,
						fontWeight: 'bold',
						padding: `${badge.padding}px ${badge.padding * 2}px`,
						borderRadius: badge.shape === 'pill' ? 1000 : badge.shape === 'rounded' ? badge.padding : '50%',
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						textAlign: 'center',
						boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
						border: '2px solid rgba(255,255,255,0.2)',
						whiteSpace: 'nowrap',
						zIndex: 100
					}}>
						{replaceTextFormat(badge.textFormat, item)}
					</div>
				))}
			</div>
		</div>
	);
};
