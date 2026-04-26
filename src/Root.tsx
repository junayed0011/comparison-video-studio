import {Composition} from 'remotion';
import {ComparisonRace} from './VideoTemplate/ComparisonRace';
import {ComparisonItem} from './VideoTemplate/types';

const defaultItems: ComparisonItem[] = [
	{
		id: '1',
		country: 'Japan',
		flagUrl: 'https://flagcdn.com/w320/jp.png',
		itemName: 'Karate',
		imageUrl: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=400&auto=format&fit=crop',
		color: '#ff4d4d',
	},
	{
		id: '2',
		country: 'Brazil',
		flagUrl: 'https://flagcdn.com/w320/br.png',
		itemName: 'Capoeira',
		imageUrl: 'https://images.unsplash.com/photo-1518176258769-f227c798150e?q=80&w=400&auto=format&fit=crop',
		color: '#4caf50',
	},
	{
		id: '3',
		country: 'Thailand',
		flagUrl: 'https://flagcdn.com/w320/th.png',
		itemName: 'Muay Thai',
		imageUrl: 'https://images.unsplash.com/photo-1599058917233-35f91f1c9914?q=80&w=400&auto=format&fit=crop',
		color: '#2196f3',
	},
];

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="ComparisonRace"
				component={ComparisonRace}
				calculateMetadata={({props}) => {
					const itemsCount = (props.items as any[])?.length || 3;
					
					// If user specified a duration in minutes, use it (converted to frames)
					if (props.durationMinutes) {
						return {
							durationInFrames: Math.floor(Number(props.durationMinutes) * 60 * 30),
						};
					}

					// Otherwise fallback to 5 seconds per item
					return {
						durationInFrames: itemsCount * 150,
					};
				}}
				fps={30}
				width={1920}
				height={1080}
				defaultProps={{
					items: defaultItems,
					title: 'Martial Arts from Different Countries',
				}}
			/>
		</>
	);
};
