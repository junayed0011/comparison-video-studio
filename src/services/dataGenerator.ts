import {ComparisonItem} from '../VideoTemplate/types';

/**
 * Calls the local automation server to collect data via ChatGPT 
 * and generate images via Grok using browser automation.
 */
export async function generateComparisonData(idea: string, duration: number): Promise<{items: ComparisonItem[]; title: string}> {
	console.log(`Requesting automation for: ${idea}`);

	try {
		const response = await fetch('http://localhost:3001/api/generate', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ idea, duration }),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to generate data');
		}

		const data = await response.json();
		return data;
	} catch (e) {
		console.error("Fetch error:", e);
		throw new Error("Could not connect to automation server. Make sure 'npm run server' is running.");
	}
}
