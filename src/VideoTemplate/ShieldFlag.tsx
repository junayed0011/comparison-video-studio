import React from 'react';
import {Img} from 'remotion';

export const ShieldFlag: React.FC<{url: string; style?: React.CSSProperties}> = ({url, style}) => {
	return (
		<div
			style={{
				width: 120,
				height: 140,
				position: 'relative',
				overflow: 'hidden',
				clipPath: 'path("M 0 0 L 120 0 L 120 100 C 120 120 60 140 60 140 C 60 140 0 120 0 100 L 0 0 Z")',
				boxShadow: '0 10px 20px rgba(0,0,0,0.5)',
				border: '4px solid white',
				...style,
			}}
		>
			<Img
				src={url}
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
				}}
				alt="flag"
			/>
		</div>
	);
};
