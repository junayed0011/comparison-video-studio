import React, { useState, useEffect, useRef } from 'react';
import { Player } from '@remotion/player';
import { ComparisonCard } from './VideoTemplate/ComparisonCard';
import { ComparisonItem } from './VideoTemplate/types';
import { themes, ThemeConfig, getTheme } from './lib/themes';

// --- Premium Design System ---
const uiTheme = {
	bg: '#0a0a0c',
	surface: 'rgba(20, 20, 25, 0.7)',
	border: 'rgba(255, 255, 255, 0.1)',
	accent: '#1a49e0',
	accentGradient: 'linear-gradient(135deg, #1a49e0 0%, #00d2ff 100%)',
	text: '#ffffff',
	textMuted: '#88888b',
	radius: '12px',
	glass: {
		backdropFilter: 'blur(12px)',
		WebkitBackdropFilter: 'blur(12px)',
	}
};

const inputStyle: React.CSSProperties = {
	width: '100%',
	padding: '10px 12px',
	borderRadius: uiTheme.radius,
	border: `1px solid ${uiTheme.border}`,
	backgroundColor: 'rgba(0,0,0,0.3)',
	color: uiTheme.text,
	fontSize: '13px',
	marginBottom: '12px',
	outline: 'none',
	transition: 'border-color 0.2s',
};

const buttonStyle: React.CSSProperties = {
	padding: '10px 20px',
	borderRadius: uiTheme.radius,
	border: 'none',
	background: uiTheme.accentGradient,
	color: 'white',
	cursor: 'pointer',
	fontWeight: 600,
	fontSize: '13px',
	transition: 'transform 0.2s, filter 0.2s',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	gap: '8px',
};

const labelStyle: React.CSSProperties = {
	display: 'block',
	marginBottom: '6px',
	fontSize: '10px',
	fontWeight: 800,
	color: uiTheme.textMuted,
	textTransform: 'uppercase',
	letterSpacing: '1px',
};

const inputGroupStyle: React.CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: '5px',
	marginBottom: '15px',
};

const colorInputStyle: React.CSSProperties = {
	width: '100%',
	height: '35px',
	padding: '2px',
	borderRadius: uiTheme.radius,
	border: `1px solid ${uiTheme.border}`,
	backgroundColor: 'rgba(0,0,0,0.3)',
	cursor: 'pointer',
};

export const Dashboard: React.FC = () => {
	const [idea, setIdea] = useState('');
	const [duration, setDuration] = useState<number | string>(1);
	const [iconType, setIconType] = useState<'flags' | 'logos'>('flags');
	const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
	const [activeSidebar, setActiveSidebar] = useState<'master' | 'inspector'>('master');
	const [inspectorTab, setInspectorTab] = useState<'project' | 'design' | 'layers' | 'item' | 'card' | 'console'>('project');
	const [error, setError] = useState<string | null>(null);
	
	const [customTheme, setCustomTheme] = useState<ThemeConfig>(() => {
		const saved = localStorage.getItem('defaultCustomTheme');
		if (saved) {
			try { 
				const parsed = JSON.parse(saved);
				return parsed; 
			} catch (e) { return themes.auto; }
		}
		return themes.auto;
	});

	// Robust initialization
	useEffect(() => {
		const saved = localStorage.getItem('defaultCustomTheme');
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				setCustomTheme(getTheme(parsed));
			} catch (e) {}
		} else {
            setCustomTheme(getTheme(undefined));
        }
	}, []);

	// --- History System ---
	const [history, setHistory] = useState<any[]>([]);
	const [redoStack, setRedoStack] = useState<any[]>([]);

	const [videoProps, setVideoProps] = useState<{items: ComparisonItem[]; title: string; theme?: string | ThemeConfig} | null>(null);
	const [loading, setLoading] = useState(false);
	const [currentStep, setCurrentStep] = useState(0);
	const [logs, setLogs] = useState<string[]>([]);
	const [connected, setConnected] = useState(false);
	const [videoUrl, setVideoUrl] = useState<string | null>(null);
	const logRef = useRef<HTMLDivElement>(null);
	const playerRef = useRef<any>(null);

	const saveToHistory = (currentProps: any, currentTheme: any) => {
		setHistory(prev => [...prev.slice(-19), { props: JSON.parse(JSON.stringify(currentProps || null)), theme: JSON.parse(JSON.stringify(currentTheme)) }]);
		setRedoStack([]);
	};

	const undo = () => {
		if (history.length === 0) return;
		const last = history[history.length - 1];
		setRedoStack(prev => [...prev, { props: JSON.parse(JSON.stringify(videoProps || null)), theme: JSON.parse(JSON.stringify(customTheme)) }]);
		setVideoProps(last.props);
		setCustomTheme(last.theme);
		setHistory(prev => prev.slice(0, -1));
	};

	const redo = () => {
		if (redoStack.length === 0) return;
		const next = redoStack[redoStack.length - 1];
		setHistory(prev => [...prev, { props: JSON.parse(JSON.stringify(videoProps || null)), theme: JSON.parse(JSON.stringify(customTheme)) }]);
		setVideoProps(next.props);
		setCustomTheme(next.theme);
		setRedoStack(prev => prev.slice(0, -1));
	};

    const resetProject = () => {
        setVideoProps(null);
        setVideoUrl(null);
        setLogs(['Ready for new project.']);
        setError(null);
        setIdea('');
        setDuration(1);
    };

	useEffect(() => {
		if (logRef.current) {
			logRef.current.scrollTop = logRef.current.scrollHeight;
		}
	}, [logs]);

	// --- Lifecycle ---
	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/data`);
				if (response.ok) {
					const data = await response.json();
					setVideoProps(data);
				}
			} catch (e) { console.log("No existing video data found"); }
		};
		fetchData();

		const eventSource = new EventSource(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/logs`);
		eventSource.onopen = () => setConnected(true);
		eventSource.onerror = () => { setConnected(false); eventSource.close(); };
		eventSource.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (data.type === 'heartbeat') return;
			if (data.message) {
				if (data.message.startsWith('VIDEO_URL:')) {
                    const url = data.message.replace('VIDEO_URL:', '');
					setVideoUrl(url);
                    setVideoProps(null);
				}
				if (data.message.includes('Step 1/3')) setCurrentStep(1);
				if (data.message.includes('Step 2/3')) setCurrentStep(2);
				if (data.message.startsWith('JSON_RESULT:')) {
					try {
						const result = JSON.parse(data.message.replace('JSON_RESULT:', ''));
						setVideoProps(result);
						setLoading(false);
						setCurrentStep(3);
					} catch (e) { console.error('Failed to parse final result', e); }
				} else {
					setLogs(prev => [...prev.slice(-100), data.message]);
				}
			}
		};
		return () => eventSource.close();
	}, []);

	// --- Handlers ---
	const handleGenerate = async () => {
		if (!idea) return;
		setLoading(true);
		setLogs(['Starting Cloud AI Generation...']);
		setCurrentStep(1);
		try {
			// Call InsForge Edge Function directly
			const response = await fetch(`${import.meta.env.VITE_INSFORGE_BASE_URL}/functions/v1/generate-video-data`, {
				method: 'POST',
				headers: { 
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${import.meta.env.VITE_INSFORGE_ANON_KEY}`
				},
				body: JSON.stringify({ idea, duration: Number(duration), iconType, templateSelection: 'auto' }),
			});
			if (!response.ok) throw new Error('Generation failed');
			const data = await response.json();
			data.durationMinutes = Number(duration);
			setVideoProps(data);
			setLogs(prev => [...prev, '✅ Generation complete!', 'Theme: ' + data.theme]);
			setCurrentStep(2);
		} catch (err: any) {
			setLogs(prev => [...prev, '❌ Error: ' + err.message]);
		} finally {
			setLoading(false);
		}
	};

	const handleRender = async () => {
		if (!videoProps) return;
		setLoading(true);
		setVideoUrl(null);
		try {
			const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/render`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...videoProps, theme: customTheme }),
			});
			
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error || `Server responded with ${response.status}`);
			}

			const result = await response.json();
			if (result.success || result.status === 'started') {
				alert('🚀 Render started! Check the automation terminal for progress.');
			} else {
				alert('❌ Render failed: ' + (result.error || 'Unknown server error'));
			}
		} catch (error: any) {
			console.error('Render request failed:', error);
			alert('❌ Connection Error: ' + (error.message || 'Could not connect to render server'));
		}
		setLoading(false);
	};

	const moveItem = (index: number, direction: 'up' | 'down') => {
		if (!videoProps) return;
		saveToHistory(videoProps, customTheme);
		const newItems = [...videoProps.items];
		const targetIndex = direction === 'up' ? index - 1 : index + 1;
		if (targetIndex < 0 || targetIndex >= newItems.length) return;
		const temp = newItems[index];
		newItems[index] = newItems[targetIndex];
		newItems[targetIndex] = temp;
		setVideoProps({ ...videoProps, items: newItems });
	};

	const updateItem = (index: number, updates: Partial<ComparisonItem>) => {
		if (!videoProps) return;
		saveToHistory(videoProps, customTheme);
		const newItems = [...videoProps.items];
		newItems[index] = { ...newItems[index], ...updates };
		setVideoProps({ ...videoProps, items: newItems });
	};

	const updateOverride = (key: string, value: any) => {
		if (!videoProps || selectedItemIndex === null) return;
		saveToHistory(videoProps, customTheme);
		const item = videoProps.items[selectedItemIndex];
		const overrides = { ...(item.overrides || {}), [key]: value };
		updateItem(selectedItemIndex, { overrides });
	};

	const addGlobalLayer = (type: any) => {
		saveToHistory(videoProps, customTheme);
		const newLayer = {
			id: `l_${Date.now()}`, type, x: 50, y: 50, width: 40, height: 10, 
			fontSize: 30, color: '#ffffff', zIndex: 10, textFormat: type === 'text' ? '{value}' : undefined
		};
		setCustomTheme({ ...customTheme, layers: [...(customTheme.layers || []), newLayer] });
	};

	const addItemLayer = (type: any) => {
		if (selectedItemIndex === null || !videoProps) return;
		saveToHistory(videoProps, customTheme);
		const item = videoProps.items[selectedItemIndex];
		const layers = [...(item.overrides?.layers || customTheme.layers || [])];
		layers.push({
			id: `li_${Date.now()}`, type, x: 50, y: 50, width: 40, height: 10, 
			fontSize: 30, color: '#ffffff', zIndex: 10, textFormat: type === 'text' ? '{value}' : undefined
		});
		updateOverride('layers', layers);
	};

	const renderLayerEditor = (layer: any, index: number, isIndividual = false) => (
		<div key={layer.id || index} style={{ 
			backgroundColor: 'rgba(255,255,255,0.04)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '15px', transition: 'transform 0.2s', cursor: 'default'
		}} className="layer-card">
			<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
				<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
					<span style={{ fontSize: 14 }}>{layer.type === 'text' ? '📝' : layer.type === 'image' ? '🖼️' : layer.type === 'flag' ? '🚩' : '💠'}</span>
					<strong style={{ fontSize: '10px', color: uiTheme.accent, letterSpacing: 1 }}>{layer.type.toUpperCase()}</strong>
				</div>
				<button 
					onClick={() => {
						saveToHistory(videoProps, customTheme);
						if (isIndividual) {
							const layers = [...(videoProps?.items[selectedItemIndex!].overrides?.layers || [])];
							layers.splice(index, 1);
							updateOverride('layers', layers);
						} else {
							const layers = [...(customTheme.layers || [])];
							layers.splice(index, 1);
							setCustomTheme({ ...customTheme, layers });
						}
					}}
					style={{ background: 'rgba(255,77,77,0.1)', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '9px', fontWeight: 800, padding: '4px 8px', borderRadius: 6 }}
				>REMOVE</button>
			</div>
			<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
				<div style={inputGroupStyle}>
					<div style={{ display: 'flex', justifyContent: 'space-between' }}><label style={{...labelStyle, fontSize: '9px'}}>X POSITION</label><span style={{ fontSize: 9, color: uiTheme.accent }}>{layer.x}%</span></div>
					<input type="range" min="0" max="100" value={layer.x} className="modern-slider" onChange={(e) => {
						if (isIndividual) {
							const layers = [...(videoProps?.items[selectedItemIndex!].overrides?.layers || [])];
							layers[index] = { ...layers[index], x: Number(e.target.value) };
							updateOverride('layers', layers);
						} else {
							const layers = [...(customTheme.layers || [])];
							layers[index] = { ...layers[index], x: Number(e.target.value) };
							setCustomTheme({ ...customTheme, layers });
						}
					}} />
				</div>
				<div style={inputGroupStyle}>
					<div style={{ display: 'flex', justifyContent: 'space-between' }}><label style={{...labelStyle, fontSize: '9px'}}>Y POSITION</label><span style={{ fontSize: 9, color: uiTheme.accent }}>{layer.y}%</span></div>
					<input type="range" min="0" max="100" value={layer.y} className="modern-slider" onChange={(e) => {
						if (isIndividual) {
							const layers = [...(videoProps?.items[selectedItemIndex!].overrides?.layers || [])];
							layers[index] = { ...layers[index], y: Number(e.target.value) };
							updateOverride('layers', layers);
						} else {
							const layers = [...(customTheme.layers || [])];
							layers[index] = { ...layers[index], y: Number(e.target.value) };
							setCustomTheme({ ...customTheme, layers });
						}
					}} />
				</div>
			</div>
		</div>
	);

	return (
		<div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: uiTheme.bg, color: uiTheme.text, overflow: 'hidden' }}>
			<div style={{ height: '60px', borderBottom: `1px solid ${uiTheme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 100, ...uiTheme.glass }}>
				<div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: uiTheme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 16 }}>V</div>
                        <h1 style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.5, margin: 0 }}>Video Studio Pro</h1>
                    </div>
                    {videoProps && (
                        <button 
                            onClick={resetProject}
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#bbb', padding: '6px 12px', borderRadius: 8, fontSize: 11, cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        >
                            + New Video
                        </button>
                    )}
                </div>
				<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
					{videoUrl && (
						<a href={videoUrl} target="_blank" rel="noopener noreferrer" style={{ ...buttonStyle, background: '#27ae60', textDecoration: 'none' }}>⬇️ Download Video</a>
					)}
					<button onClick={handleRender} style={buttonStyle}>🚀 Finalize & Render</button>
				</div>
			</div>

			<div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
				<div style={{ width: '400px', backgroundColor: uiTheme.surface, borderRight: `1px solid ${uiTheme.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', ...uiTheme.glass }}>
					<div style={{ display: 'flex', borderBottom: `1px solid ${uiTheme.border}` }}>
						<button onClick={() => { setActiveSidebar('master'); setInspectorTab('project'); }} style={{ flex: 1, padding: '15px', background: 'none', border: 'none', color: activeSidebar === 'master' ? uiTheme.text : uiTheme.textMuted, fontSize: 11, fontWeight: 800, cursor: 'pointer', borderBottom: activeSidebar === 'master' ? `2px solid ${uiTheme.accent}` : 'none' }}>MASTER</button>
						<button onClick={() => { setActiveSidebar('inspector'); setInspectorTab('item'); }} disabled={selectedItemIndex === null} style={{ flex: 1, padding: '15px', background: 'none', border: 'none', color: activeSidebar === 'inspector' ? uiTheme.text : uiTheme.textMuted, fontSize: 11, fontWeight: 800, cursor: 'pointer', borderBottom: activeSidebar === 'inspector' ? `2px solid ${uiTheme.accent}` : 'none', opacity: selectedItemIndex === null ? 0.3 : 1 }}>INSPECTOR</button>
					</div>

					<div style={{ display: 'flex', gap: 10, padding: '10px 15px', background: 'rgba(0,0,0,0.2)', borderBottom: `1px solid ${uiTheme.border}` }}>
						<button onClick={undo} disabled={history.length === 0} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: history.length === 0 ? '#444' : 'white', padding: '6px', borderRadius: 8, fontSize: 10, cursor: history.length === 0 ? 'default' : 'pointer', fontWeight: 700 }}>↩ UNDO</button>
						<button onClick={redo} disabled={redoStack.length === 0} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: redoStack.length === 0 ? '#444' : 'white', padding: '6px', borderRadius: 8, fontSize: 10, cursor: redoStack.length === 0 ? 'default' : 'pointer', fontWeight: 700 }}>↪ REDO</button>
					</div>

					<div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
						{activeSidebar === 'master' ? (
							<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
								<div style={{ display: 'flex', gap: 5, background: 'rgba(0,0,0,0.2)', padding: 4, borderRadius: 10 }}>
									{['project', 'design', 'layers', 'console'].map(tab => (
										<button key={tab} onClick={() => setInspectorTab(tab as any)} style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: 10, fontWeight: 800, background: inspectorTab === tab ? uiTheme.accent : 'transparent', border: 'none', color: inspectorTab === tab ? 'white' : uiTheme.textMuted, cursor: 'pointer' }}>{tab.toUpperCase()}</button>
									))}
								</div>

								{inspectorTab === 'project' && (
									<div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
										<label style={labelStyle}>Project Idea</label>
										<textarea value={idea} onChange={(e) => setIdea(e.target.value)} style={{ ...inputStyle, minHeight: 80, resize: 'none' }} placeholder="E.g. Tallest Buildings 2026..." />
										<button onClick={handleGenerate} disabled={loading} style={{ ...buttonStyle, width: '100%' }}>{loading ? '🪄 Generating...' : '✨ Create Video Script'}</button>
										<label style={labelStyle}>Duration (Min)</label>
										<input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} style={inputStyle} />
									</div>
								)}

								{inspectorTab === 'design' && (
									<div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
										<div style={inputGroupStyle}><label style={labelStyle}>Global Background</label><input type="color" value={customTheme.background} onChange={(e) => setCustomTheme({...customTheme, background: e.target.value})} style={colorInputStyle} /></div>
										<div style={inputGroupStyle}><label style={labelStyle}>Card Shape</label><select value={customTheme.cardShape} onChange={(e) => setCustomTheme({...customTheme, cardShape: e.target.value as any})} style={inputStyle}><option value="rectangle">Rectangle</option><option value="rounded">Rounded</option><option value="pill">Pill</option></select></div>
										<div style={inputGroupStyle}>
											<div style={{ display: 'flex', justifyContent: 'space-between' }}><label style={labelStyle}>Animation Scale</label><span style={{ fontSize: 10, color: uiTheme.accent }}>{(customTheme.cardScale || 1).toFixed(2)}x</span></div>
											<input type="range" min="0.5" max="2" step="0.05" value={customTheme.cardScale || 1} className="modern-slider" onChange={(e) => setCustomTheme({...customTheme, cardScale: Number(e.target.value)})} />
										</div>
										<button onClick={() => { localStorage.setItem('defaultCustomTheme', JSON.stringify(customTheme)); alert('Saved!'); }} style={{...buttonStyle, background: 'rgba(255,255,255,0.05)', fontSize: 11}}>💾 Save as Default</button>
									</div>
								)}

								{inspectorTab === 'layers' && (
									<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
										<div style={{ display: 'flex', gap: 5 }}>
											{['text', 'image', 'flag', 'shape'].map(type => (
												<button key={type} onClick={() => addGlobalLayer(type as any)} style={{...buttonStyle, flex: 1, padding: '8px', fontSize: 9, background: 'rgba(255,255,255,0.05)'}}>+ {type[0].toUpperCase()}</button>
											))}
										</div>
										{(customTheme.layers || []).map((layer, idx) => renderLayerEditor(layer, idx, false))}
									</div>
								)}

								{inspectorTab === 'console' && (
									<div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '400px' }}>
										<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
											<label style={labelStyle}>Live Progress</label>
											<div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
												<div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: connected ? '#27ae60' : '#e74c3c', boxShadow: connected ? '0 0 10px #27ae60' : 'none' }}></div>
												<span style={{ fontSize: 9, color: uiTheme.textMuted }}>{connected ? 'LIVE' : 'DISCONNECTED'}</span>
											</div>
										</div>
										<div 
											ref={logRef}
											style={{ 
												flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: 12, fontSize: 11, fontFamily: 'monospace', overflowY: 'auto', border: `1px solid ${uiTheme.border}`, display: 'flex', flexDirection: 'column', gap: 6, scrollBehavior: 'smooth'
											}}
										>
											{logs.length === 0 ? (
												<div style={{ color: '#444', textAlign: 'center', marginTop: 20 }}>Waiting for pipeline logs...</div>
											) : (
												logs.map((log, i) => (
													<div key={i} style={{ 
														color: log.includes('✅') ? '#27ae60' : log.includes('❌') || log.includes('⚠️') ? '#e74c3c' : '#bbb',
														borderLeft: `2px solid ${log.includes('Step') ? uiTheme.accent : 'transparent'}`,
														paddingLeft: log.includes('Step') ? 8 : 0
													}}>
														{log}
													</div>
												))
											)}
										</div>
										<button onClick={() => setLogs([])} style={{ ...buttonStyle, background: 'rgba(255,255,255,0.05)', fontSize: 9, padding: '6px' }}>Clear Logs</button>
									</div>
								)}
							</div>
						) : (
							<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
								{selectedItemIndex !== null && videoProps && (
									<>
										<div style={{ display: 'flex', gap: 5, background: 'rgba(0,0,0,0.2)', padding: 4, borderRadius: 10 }}>
											{['item', 'card', 'layers'].map(tab => (
												<button key={tab} onClick={() => setInspectorTab(tab as any)} style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: 10, fontWeight: 800, background: inspectorTab === tab ? uiTheme.accent : 'transparent', border: 'none', color: inspectorTab === tab ? 'white' : uiTheme.textMuted, cursor: 'pointer' }}>{tab.toUpperCase()}</button>
											))}
										</div>

										{inspectorTab === 'item' && (
											<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
												<label style={labelStyle}>Name</label>
												<input type="text" value={videoProps.items[selectedItemIndex].itemName} onChange={(e) => updateItem(selectedItemIndex, { itemName: e.target.value })} style={inputStyle} />
												<label style={labelStyle}>Value</label>
												<input type="text" value={videoProps.items[selectedItemIndex].value || ''} onChange={(e) => updateItem(selectedItemIndex, { value: e.target.value })} style={inputStyle} />
											</div>
										)}

										{inspectorTab === 'card' && (
											<div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
												<label style={labelStyle}>Override Card Color</label>
												<input type="color" value={videoProps.items[selectedItemIndex].overrides?.backgroundColor || videoProps.items[selectedItemIndex].color} onChange={(e) => updateOverride('backgroundColor', e.target.value)} style={colorInputStyle} />
											</div>
										)}

										{inspectorTab === 'layers' && (
											<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
												{!videoProps.items[selectedItemIndex].overrides?.layers ? (
													<button onClick={() => updateOverride('layers', JSON.parse(JSON.stringify(customTheme.layers || [])))} style={{...buttonStyle, width: '100%'}}>⚡ Clone Global Template</button>
												) : (
													<>
														<div style={{ display: 'flex', gap: 5 }}>
															{['text', 'image', 'flag', 'shape'].map(type => (
																<button key={type} onClick={() => addItemLayer(type as any)} style={{...buttonStyle, flex: 1, padding: '8px', fontSize: 9, background: 'rgba(255,255,255,0.05)'}}>+ {type[0].toUpperCase()}</button>
															))}
														</div>
														<button onClick={() => updateOverride('layers', undefined)} style={{background: 'none', border: 'none', color: '#ff4d4d', fontSize: 10, fontWeight: 800, cursor: 'pointer'}}>RESET TO GLOBAL</button>
														{((videoProps.items[selectedItemIndex]?.overrides?.layers as any[]) || []).map((layer: any, idx: number) => renderLayerEditor(layer, idx, true))}
													</>
												)}
											</div>
										)}
									</>
								)}
							</div>
						)}
					</div>
				</div>

				<div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: uiTheme.bg, position: 'relative', overflow: 'hidden' }}>
					{activeSidebar === 'master' ? (
						<div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
								{(videoProps?.items || []).map((item, idx) => (
									<div key={idx} onClick={() => { setSelectedItemIndex(idx); setActiveSidebar('inspector'); }} style={{ cursor: 'pointer', position: 'relative', aspectRatio: '16/9', backgroundColor: '#000', borderRadius: '16px', overflow: 'hidden', border: `4px solid ${uiTheme.surface}` }}>
										<div style={{ width: '1920px', height: '1080px', transform: 'scale(0.18)', transformOrigin: 'top left', pointerEvents: 'none' }}>
											<ComparisonCard item={item} theme={getTheme(customTheme)} isFullPage={true} />
										</div>
									</div>
								))}
							</div>
						</div>
					) : (
						<div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
							{videoProps && selectedItemIndex !== null && (
								<div style={{ width: '90%', maxWidth: '850px', aspectRatio: '16/9', backgroundColor: '#000', borderRadius: '24px', overflow: 'hidden', border: `8px solid ${uiTheme.surface}` }}>
									<Player component={ComparisonCard} durationInFrames={150} fps={30} compositionWidth={1920} compositionHeight={1080} style={{ width: '100%', height: '100%' }} inputProps={{ item: videoProps.items[selectedItemIndex], theme: customTheme, isFullPage: true }} controls />
								</div>
							)}
						</div>
					)}
				</div>

				<div style={{ width: '280px', backgroundColor: uiTheme.surface, borderLeft: `1px solid ${uiTheme.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', ...uiTheme.glass }}>
					<div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
						{(videoProps?.items || []).map((item, index) => (
							<div key={index} onClick={() => { setSelectedItemIndex(index); setActiveSidebar('inspector'); }} style={{ padding: '10px', borderRadius: 10, backgroundColor: selectedItemIndex === index ? 'rgba(26, 73, 224, 0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selectedItemIndex === index ? uiTheme.accent : uiTheme.border}`, marginBottom: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
								<div style={{ flex: 1, fontSize: 11, fontWeight: 700 }}>{item.itemName}</div>
							</div>
						))}
					</div>
				</div>
			</div>
			<style>{`
				::-webkit-scrollbar { width: 8px; height: 8px; }
				::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
				::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
				::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
				
				.modern-slider { -webkit-appearance: none; width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 5px; outline: none; margin: 10px 0; }
				.modern-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 14px; height: 14px; background: ${uiTheme.accent}; border-radius: 50%; cursor: pointer; box-shadow: 0 0 10px ${uiTheme.accent}88; }
				.layer-card:hover { background: rgba(255,255,255,0.06) !important; border-color: rgba(255,255,255,0.15) !important; transform: translateY(-2px); }
			`}</style>
		</div>
	);
};
