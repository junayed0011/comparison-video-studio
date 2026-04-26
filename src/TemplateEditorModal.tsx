import React from 'react';
import { ComparisonItem, VideoProps } from './VideoTemplate/types';

interface TemplateEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    theme: ThemeConfig;
    onChange: (theme: ThemeConfig) => void;
    onSaveAsDefault?: () => void;
    items: ComparisonItem[];
    selectedItem: ComparisonItem | null;
    onSelectItem: (index: number) => void;
    onItemChange: (item: ComparisonItem) => void;
}

export const TemplateEditorModal: React.FC<TemplateEditorModalProps> = ({ 
    isOpen, onClose, theme, onChange, onSaveAsDefault, items, selectedItem, onSelectItem, onItemChange 
}) => {
    const [activeTab, setActiveTab] = React.useState<'global' | 'cards' | 'layers' | 'individual'>('global');
    if (!isOpen) return null;

    const handleChange = (key: keyof ThemeConfig, value: string | number | any) => {
        onChange({ ...theme, [key]: value });
    };


    const handleLayerChange = (index: number, key: string, value: any, isIndividual = false) => {
        if (isIndividual && selectedItem) {
            const layers = [...(selectedItem.overrides?.layers || [])];
            layers[index] = { ...layers[index], [key]: value };
            onItemChange({ ...selectedItem, overrides: { ...selectedItem.overrides, layers } });
        } else {
            const newLayers = [...(theme.layers || [])];
            newLayers[index] = { ...newLayers[index], [key]: value };
            onChange({ ...theme, layers: newLayers });
        }
    };

    const removeLayer = (index: number, isIndividual = false) => {
        if (isIndividual && selectedItem) {
            const layers = [...(selectedItem.overrides?.layers || [])];
            layers.splice(index, 1);
            onItemChange({ ...selectedItem, overrides: { ...selectedItem.overrides, layers } });
        } else {
            const newLayers = [...(theme.layers || [])];
            newLayers.splice(index, 1);
            onChange({ ...theme, layers: newLayers });
        }
    };

    const addLayer = (type: any = 'text', isIndividual = false) => {
        const newLayer = {
            id: `layer_${Date.now()}`,
            type: type,
            x: 50,
            y: 50,
            width: 50,
            height: 10,
            fontSize: 30,
            color: '#ffffff',
            backgroundColor: type === 'shape' ? '#1a49e0' : 'transparent',
            zIndex: 10,
            textFormat: type === 'text' ? '{value}' : undefined,
            imageShape: 'rectangle',
            objectFit: 'cover'
        };

        if (isIndividual && selectedItem) {
            const layers = [...(selectedItem.overrides?.layers || theme.layers || [])];
            layers.push(newLayer);
            onItemChange({ ...selectedItem, overrides: { ...selectedItem.overrides, layers } });
        } else {
            const newLayers = [...(theme.layers || [])];
            newLayers.push(newLayer);
            onChange({ ...theme, layers: newLayers });
        }
    };

    // Helper to render layer editor
    const renderLayerEditor = (layer: any, index: number, isIndividual = false) => (
        <div key={layer.id} style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: layer.type === 'text' ? '#007bff' : layer.type === 'image' ? '#28a745' : '#ffc107' }}></div>
                    <strong style={{ fontSize: 10, fontWeight: 800, color: '#888' }}>{layer.type.toUpperCase()}</strong>
                </div>
                <button onClick={() => removeLayer(index, isIndividual)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: 10, fontWeight: 800 }}>REMOVE</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                <div style={inputGroup}>
                    <label style={labelStyle}>Position X: {layer.x}%</label>
                    <input type="range" min="-50" max="150" value={layer.x} onChange={(e) => handleLayerChange(index, 'x', Number(e.target.value), isIndividual)} />
                </div>
                <div style={inputGroup}>
                    <label style={labelStyle}>Position Y: {layer.y}%</label>
                    <input type="range" min="-50" max="150" value={layer.y} onChange={(e) => handleLayerChange(index, 'y', Number(e.target.value), isIndividual)} />
                </div>
                <div style={inputGroup}>
                    <label style={labelStyle}>Width: {layer.width}%</label>
                    <input type="range" min="0" max="200" value={layer.width} onChange={(e) => handleLayerChange(index, 'width', Number(e.target.value), isIndividual)} />
                </div>
                <div style={inputGroup}>
                    <label style={labelStyle}>Height: {layer.height}%</label>
                    <input type="range" min="0" max="200" value={layer.height} onChange={(e) => handleLayerChange(index, 'height', Number(e.target.value), isIndividual)} />
                </div>

                {['text', 'country', 'name', 'rank'].includes(layer.type) && (
                    <>
                        <div style={inputGroup}>
                            <label style={labelStyle}>Size</label>
                            <input type="number" value={layer.fontSize} onChange={(e) => handleLayerChange(index, 'fontSize', Number(e.target.value), isIndividual)} style={inputStyle} />
                        </div>
                        <div style={inputGroup}>
                            <label style={labelStyle}>Color</label>
                            <input type="color" value={getHexColor(layer.color || '#ffffff')} onChange={(e) => handleLayerChange(index, 'color', e.target.value), isIndividual} style={colorInputStyle} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );

    // Helper to safely parse colors for color pickers (fallback to #000000 if gradient)
    const getHexColor = (colorStr: string) => {
        if (!colorStr) return '#000000';
        if (colorStr.startsWith('#')) return colorStr.slice(0, 7);
        return '#000000'; // fallback for gradients/rgba so picker doesn't break
    };

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                <div style={headerStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 20 }}>🎨</span>
                        <h3 style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.5px' }}>Template Designer</h3>
                    </div>
                    <button onClick={onClose} style={closeButtonStyle}>✕</button>
                </div>
                
                <div style={formGrid}>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, marginBottom: 20, background: 'rgba(0,0,0,0.2)', padding: 4, borderRadius: 10 }}>
                        {['global', 'cards', 'layers', 'individual'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                style={{
                                    ...tabButtonStyle,
                                    backgroundColor: activeTab === tab ? '#1a49e0' : 'transparent',
                                    color: activeTab === tab ? 'white' : '#888',
                                }}
                            >
                                {tab.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    <div style={{ overflowY: 'auto', maxHeight: 'calc(90vh - 180px)', paddingRight: 10 }}>
                        {activeTab === 'individual' && (
                            <div style={{ gridColumn: '1 / -1' }}>
                                {!selectedItem ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                        <div style={{ padding: '20px', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 15, border: '2px dashed rgba(255,255,255,0.05)' }}>
                                            <p style={{ color: '#666', fontWeight: 600, margin: 0 }}>Select a card to customize its unique overrides.</p>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 15 }}>
                                            {items.map((item, idx) => (
                                                <div 
                                                    key={idx} 
                                                    onClick={() => onSelectItem(idx)}
                                                    style={{ 
                                                        backgroundColor: 'rgba(255,255,255,0.03)', 
                                                        borderRadius: 12, 
                                                        padding: 12, 
                                                        cursor: 'pointer', 
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        transition: 'all 0.2s',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 12
                                                    }}
                                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
                                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                                                >
                                                    <img src={item.flagUrl} style={{ width: 30, height: 20, borderRadius: 4, objectFit: 'cover' }} />
                                                    <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.itemName}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                            <h3 style={{ margin: 0, fontSize: 14, color: '#1a49e0', textTransform: 'uppercase', letterSpacing: 1 }}>Editing: {selectedItem.itemName}</h3>
                                            <button 
                                                onClick={() => onSelectItem(-1 as any)} 
                                                style={{ ...secondaryButtonStyle, padding: '8px 15px', fontSize: 11 }}
                                            >
                                                ← BACK TO LIST
                                            </button>
                                        </div>
                                        
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 30 }}>
                                            <div style={inputGroup}>
                                                <label style={labelStyle}>Individual Card Shape</label>
                                                <select 
                                                    style={inputStyle}
                                                    value={selectedItem.overrides?.cardShape || ''}
                                                    onChange={(e) => onItemChange({
                                                        ...selectedItem, 
                                                        overrides: { ...selectedItem.overrides, cardShape: (e.target.value || undefined) as any }
                                                    })}
                                                >
                                                    <option value="">--- Inherit Universal ---</option>
                                                    <option value="rectangle">Rectangle</option>
                                                    <option value="rounded">Rounded</option>
                                                    <option value="pill">Pill / Circle</option>
                                                </select>
                                            </div>
                                            
                                            <div style={inputGroup}>
                                                <label style={labelStyle}>Individual Border Color</label>
                                                <div style={{display: 'flex', gap: 10}}>
                                                    <input 
                                                        type="color" 
                                                        value={getHexColor(selectedItem.overrides?.cardBorderColor || '#000000')} 
                                                        onChange={(e) => onItemChange({
                                                            ...selectedItem, 
                                                            overrides: { ...selectedItem.overrides, cardBorderColor: e.target.value }
                                                        })} 
                                                        style={{ ...colorInputStyle, flex: 1 }} 
                                                    />
                                                    <button onClick={() => onItemChange({
                                                        ...selectedItem, 
                                                        overrides: { ...selectedItem.overrides, cardBorderColor: undefined }
                                                    })} style={{...secondaryButtonStyle, padding: '0 15px'}}>Reset</button>
                                                </div>
                                            </div>

                                            <div style={{...inputGroup, gridColumn: '1 / -1'}}>
                                                <label style={labelStyle}>Individual Card Color</label>
                                                <div style={{display: 'flex', gap: 10, alignItems: 'center'}}>
                                                    <input 
                                                        type="color" 
                                                        value={getHexColor(selectedItem.overrides?.backgroundColor || selectedItem.color)} 
                                                        onChange={(e) => onItemChange({
                                                            ...selectedItem, 
                                                            overrides: { ...selectedItem.overrides, backgroundColor: e.target.value }
                                                        })} 
                                                        style={{...colorInputStyle, width: 60}} 
                                                    />
                                                    <span style={{fontSize: 12, color: '#666'}}>Custom background for this card only</span>
                                                    <button onClick={() => onItemChange({
                                                        ...selectedItem, 
                                                        overrides: { ...selectedItem.overrides, backgroundColor: undefined }
                                                    })} style={{...secondaryButtonStyle, padding: '8px 15px', marginLeft: 'auto'}}>Reset to Default</button>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 20 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                                <h4 style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#888', letterSpacing: 1 }}>LAYER OVERRIDES</h4>
                                                {!selectedItem.overrides?.layers ? (
                                                    <button 
                                                        onClick={() => onItemChange({
                                                            ...selectedItem, 
                                                            overrides: { ...selectedItem.overrides, layers: [...(theme.layers || [])] }
                                                        })}
                                                        style={{ ...tabButtonStyle, backgroundColor: '#1a49e0', flex: 'none', padding: '8px 15px' }}
                                                    >
                                                        ⚡ OVERRIDE ALL LAYERS
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => onItemChange({
                                                            ...selectedItem, 
                                                            overrides: { ...selectedItem.overrides, layers: undefined }
                                                        })}
                                                        style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: 10, fontWeight: 800 }}
                                                    >
                                                        RESET TO GLOBAL LAYERS
                                                    </button>
                                                )}
                                            </div>

                                            {selectedItem.overrides?.layers ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                    <div style={{ display: 'flex', gap: 10, marginBottom: 5 }}>
                                                        {['text', 'image', 'flag', 'shape'].map(type => (
                                                            <button key={type} onClick={() => addLayer(type as any, true)} style={{...secondaryButtonStyle, flex: 1, padding: '8px', fontSize: 10}}>+ {type.toUpperCase()}</button>
                                                        ))}
                                                    </div>
                                                    {selectedItem.overrides.layers.map((layer, idx) => renderLayerEditor(layer, idx, true))}
                                                </div>
                                            ) : (
                                                <div style={{ padding: '30px', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.03)' }}>
                                                    <p style={{ fontSize: 11, color: '#444', margin: 0 }}>This card uses the universal template layers. Click "Override" to customize elements just for this card.</p>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {activeTab === 'global' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                <div style={{ ...inputGroup, gridColumn: '1 / -1' }}>
                                    <label style={labelStyle}>Background (CSS Gradient or Color)</label>
                                    <input type="text" value={theme.background} onChange={(e) => handleChange('background', e.target.value)} style={inputStyle} />
                                </div>
                                <div style={inputGroup}>
                                    <label style={labelStyle}>Title Text Color</label>
                                    <input type="color" value={getHexColor(theme.titleColor)} onChange={(e) => handleChange('titleColor', e.target.value)} style={colorInputStyle} />
                                </div>
                                <div style={inputGroup}>
                                    <label style={labelStyle}>Font Family</label>
                                    <input type="text" value={theme.fontFamily} onChange={(e) => handleChange('fontFamily', e.target.value)} style={inputStyle} />
                                </div>
                            </div>
                        )}

                        {activeTab === 'cards' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                <div style={inputGroup}>
                                    <label style={labelStyle}>Card Width (px)</label>
                                    <input type="number" value={theme.cardWidth ?? 400} onChange={(e) => handleChange('cardWidth', Number(e.target.value))} style={inputStyle} />
                                </div>
                                <div style={inputGroup}>
                                    <label style={labelStyle}>Card Shape</label>
                                    <select value={theme.cardShape ?? 'rectangle'} onChange={(e) => handleChange('cardShape', e.target.value)} style={inputStyle}>
                                        <option value="rectangle">Rectangle</option>
                                        <option value="rounded">Rounded</option>
                                        <option value="pill">Pill</option>
                                    </select>
                                </div>
                                <div style={inputGroup}>
                                    <label style={labelStyle}>Border Width (px)</label>
                                    <input type="number" value={theme.cardBorderWidth ?? 0} onChange={(e) => handleChange('cardBorderWidth', Number(e.target.value))} style={inputStyle} />
                                </div>
                                <div style={inputGroup}>
                                    <label style={labelStyle}>Border Color</label>
                                    <input type="color" value={getHexColor(theme.cardBorderColor)} onChange={(e) => handleChange('cardBorderColor', e.target.value)} style={colorInputStyle} />
                                </div>
                            </div>
                        )}

                        {activeTab === 'layers' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                                    {['text', 'image', 'flag', 'shape'].map(type => (
                                        <button key={type} onClick={() => addLayer(type as any)} style={{...secondaryButtonStyle, flex: 1, padding: '10px'}}>+ {type.toUpperCase()}</button>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {(theme.layers || []).map((layer, index) => renderLayerEditor(layer, index, false))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ gridColumn: '1 / -1', marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 12 }}>
                        <button 
                            onClick={onSaveAsDefault} 
                            style={{ ...saveButtonStyle, flex: 1 }}
                        >
                            💾 Save as Default Template
                        </button>
                        <button 
                            onClick={onClose} 
                            style={{ ...secondaryButtonStyle, padding: '0 30px' }}
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'flex-end', // Align to right
};

const modalStyle: React.CSSProperties = {
    backgroundColor: '#0a0a0c',
    borderLeft: '1px solid rgba(255,255,255,0.1)',
    width: '100%',
    maxWidth: '550px',
    height: '100vh',
    color: 'white',
    boxShadow: '-10px 0 50px rgba(0,0,0,0.5)',
    display: 'flex',
    flexDirection: 'column',
    padding: 30,
};

const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
};

const tabButtonStyle: React.CSSProperties = {
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 800,
    fontSize: 10,
    letterSpacing: '0.5px',
    transition: 'all 0.2s',
};

const labelStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 800,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: 5,
};

const inputStyle: React.CSSProperties = {
    padding: '12px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0,0,0,0.3)',
    color: 'white',
    fontSize: 14,
    outline: 'none',
};

const colorInputStyle: React.CSSProperties = {
    ...inputStyle,
    padding: 2,
    height: 44,
    width: '100%',
    cursor: 'pointer',
};

const saveButtonStyle: React.CSSProperties = {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: 12,
    padding: '15px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'transform 0.2s',
};

const secondaryButtonStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 13,
};

const closeButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: '#666',
    fontSize: 24,
    cursor: 'pointer',
};

const formGrid: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
};

const inputGroup: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
};
