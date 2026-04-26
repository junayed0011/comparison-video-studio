import React, { useState, useEffect } from 'react';
import { ComparisonItem } from './VideoTemplate/types';

interface ItemEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: ComparisonItem | null;
    onSave: (updatedItem: ComparisonItem) => void;
}

export const ItemEditorModal: React.FC<ItemEditorModalProps> = ({ isOpen, onClose, item, onSave }) => {
    const [editedItem, setEditedItem] = useState<ComparisonItem | null>(null);

    useEffect(() => {
        setEditedItem(item);
    }, [item]);

    if (!isOpen || !editedItem) return null;

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '12px',
        marginBottom: '15px',
        borderRadius: '8px',
        border: '1px solid #333',
        backgroundColor: '#111',
        color: 'white',
        fontSize: '14px',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        marginBottom: '5px',
        fontSize: '12px',
        color: '#888',
        textTransform: 'uppercase',
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(5px)',
        }}>
            <div style={{
                backgroundColor: '#1a1a1a',
                padding: '30px',
                borderRadius: '20px',
                width: '500px',
                border: '1px solid #333',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            }}>
                <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#fff' }}>Edit Specific Item</h2>
                
                <label style={labelStyle}>Car Name</label>
                <input 
                    style={inputStyle}
                    value={editedItem.itemName}
                    onChange={(e) => setEditedItem({...editedItem, itemName: e.target.value})}
                />

                <label style={labelStyle}>Country</label>
                <input 
                    style={inputStyle}
                    value={editedItem.country}
                    onChange={(e) => setEditedItem({...editedItem, country: e.target.value})}
                />

                <label style={labelStyle}>Value / Speed (Bottom Bar)</label>
                <input 
                    style={inputStyle}
                    value={editedItem.value || ''}
                    onChange={(e) => setEditedItem({...editedItem, value: e.target.value})}
                    placeholder="e.g. 304 MPH"
                />

                <label style={labelStyle}>Image URL</label>
                <input 
                    style={inputStyle}
                    value={editedItem.imageUrl}
                    onChange={(e) => setEditedItem({...editedItem, imageUrl: e.target.value})}
                />
                <p style={{fontSize: '11px', color: '#666', marginTop: '-10px', marginBottom: '20px'}}>
                    💡 Paste a new image link here to fix broken or bad images instantly.
                </p>

                <div style={{borderTop: '1px solid #333', paddingTop: '20px', marginBottom: '20px'}}>
                    <h3 style={{fontSize: '14px', color: '#1a49e0', margin: '0 0 15px 0', textTransform: 'uppercase', letterSpacing: '1px'}}>Individual Style Overrides</h3>
                    
                    <div style={{display: 'flex', gap: '15px'}}>
                        <div style={{flex: 1}}>
                            <label style={labelStyle}>Card Shape</label>
                            <select 
                                style={inputStyle}
                                value={editedItem.overrides?.cardShape || ''}
                                onChange={(e) => setEditedItem({
                                    ...editedItem, 
                                    overrides: { ...editedItem.overrides, cardShape: (e.target.value || undefined) as any }
                                })}
                            >
                                <option value="">--- Use Universal ---</option>
                                <option value="rectangle">Rectangle</option>
                                <option value="rounded">Rounded</option>
                                <option value="pill">Pill / Circle</option>
                            </select>
                        </div>
                        <div style={{flex: 1}}>
                            <label style={labelStyle}>Border Color</label>
                            <div style={{display: 'flex', gap: '5px'}}>
                                <input 
                                    type="color"
                                    value={editedItem.overrides?.cardBorderColor || '#000000'}
                                    onChange={(e) => setEditedItem({
                                        ...editedItem, 
                                        overrides: { ...editedItem.overrides, cardBorderColor: e.target.value }
                                    })}
                                    style={{width: '40px', height: '40px', padding: '0', border: 'none', backgroundColor: 'transparent', cursor: 'pointer'}}
                                />
                                <button 
                                    onClick={() => setEditedItem({
                                        ...editedItem, 
                                        overrides: { ...editedItem.overrides, cardBorderColor: undefined }
                                    })}
                                    style={{fontSize: '10px', background: '#333', border: 'none', color: '#aaa', borderRadius: '4px', cursor: 'pointer'}}
                                >Reset</button>
                            </div>
                        </div>
                    </div>

                    <label style={labelStyle}>Card Background Color</label>
                    <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                        <input 
                            type="color"
                            value={editedItem.overrides?.backgroundColor || editedItem.color}
                            onChange={(e) => setEditedItem({
                                ...editedItem, 
                                overrides: { ...editedItem.overrides, backgroundColor: e.target.value }
                            })}
                            style={{width: '40px', height: '40px', padding: '0', border: 'none', backgroundColor: 'transparent', cursor: 'pointer'}}
                        />
                        <span style={{fontSize: '12px', color: '#666'}}>{editedItem.overrides?.backgroundColor || 'Default Color'}</span>
                        <button 
                            onClick={() => setEditedItem({
                                ...editedItem, 
                                overrides: { ...editedItem.overrides, backgroundColor: undefined }
                            })}
                            style={{fontSize: '10px', background: '#333', border: 'none', color: '#aaa', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', marginLeft: 'auto'}}
                        >Reset to Data Color</button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button 
                        onClick={() => onSave(editedItem)}
                        style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#1a49e0',
                            color: 'white',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                        }}
                    >
                        Save Changes
                    </button>
                    <button 
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #444',
                            backgroundColor: 'transparent',
                            color: 'white',
                            cursor: 'pointer',
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};
