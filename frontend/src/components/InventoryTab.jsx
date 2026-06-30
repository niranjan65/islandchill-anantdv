import React, { useState } from 'react';
import { frappe } from '../services/frappe';

export default function InventoryTab({
  erpItems,
  inventory,
  setShowAdjustStockModal,
  setAdjustItemCode,
  invSearchQuery,
  setInvSearchQuery,
  invPage,
  setInvPage,
  selectedItemCode,
  setSelectedItemCode,
  itemsLoading
}) {
            const conn = frappe.getConnectionSettings();
          const isLiveMode = conn.isLive && conn.connected;

          const allInvItems = isLiveMode
            ? erpItems
            : Object.keys(inventory).map(code => ({ code, ...inventory[code] }));

          const filteredInvItems = allInvItems.filter(item =>
            item.code.toLowerCase().includes(invSearchQuery.toLowerCase()) ||
            item.name.toLowerCase().includes(invSearchQuery.toLowerCase()) ||
            (item.category || '').toLowerCase().includes(invSearchQuery.toLowerCase())
          );

          const displayedInvItems = filteredInvItems.slice((invPage - 1) * 20, invPage * 20);
          const totalInvPages = Math.max(1, Math.ceil(filteredInvItems.length / 20));
          const selectedItem = filteredInvItems.find(i => i.code === selectedItemCode) || filteredInvItems[0] || allInvItems[0];

          return (
            <div className="inv-tab-container">
              <div className="wo-tab-header">
                <div className="tab-title-desc">
                  <h2>Warehouse Stocks & Inventory Control</h2>
                  <p>Monitor raw ingredients, bottle components, caps, and final finished goods boxes.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="text-input"
                    style={{ width: '200px', padding: '6px 12px', fontSize: '12px' }}
                    placeholder="Search Inventory..."
                    value={invSearchQuery}
                    onChange={e => setInvSearchQuery(e.target.value)}
                  />
                  <button className="primary-btn" onClick={() => {
                    const firstItem = Object.keys(inventory)[0];
                    setAdjustItemCode(firstItem);
                    setShowAdjustStockModal(true);
                  }}>
                    Adjust Stock
                  </button>
                </div>
              </div>

              <div className="inv-explorer-grid">
                <div className="details-card">
                  {itemsLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Loading Items from ERPNext...
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Item Code</th>
                            <th>Item Name</th>
                            <th>Category</th>
                            <th>Qty In Stock</th>
                            <th>Safety Level</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayedInvItems.map(item => {
                            let health = 'normal';
                            if (item.qty < item.minLevel) {
                              health = 'low';
                            } else if (item.qty < item.minLevel * 1.5) {
                              health = 'warning';
                            }

                            const isSelected = selectedItemCode === item.code;

                            return (
                              <tr
                                key={item.code}
                                onClick={() => setSelectedItemCode(item.code)}
                                style={{ cursor: 'pointer', backgroundColor: isSelected ? 'rgba(245, 158, 11, 0.08)' : '' }}
                                className={isSelected ? 'active-row' : ''}
                              >
                                <td style={{ fontWeight: '600' }}>{item.code}</td>
                                <td>{item.name}</td>
                                <td>
                                  <span className="badge" style={{ backgroundColor: '#f3f4f6', color: '#4b5563' }}>
                                    {item.category}
                                  </span>
                                </td>
                                <td style={{ fontWeight: '600' }}>
                                  {Number(item.qty).toFixed(2)} {item.unit}
                                </td>
                                <td className="text-muted">
                                  {Number(item.minLevel).toFixed(2)} {item.unit}
                                </td>
                                <td>
                                  <span className={`stock-alert-text ${health}`} style={{ fontWeight: '600', fontSize: '11px' }}>
                                    {health === 'low' && '🚨 REORDER'}
                                    {health === 'warning' && '⚠ WARNING'}
                                    {health === 'normal' && '✓ OK'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {/* Pagination Controls */}
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '16px', padding: '16px 0' }}>
                    <button
                      className="secondary-btn"
                      disabled={invPage === 1}
                      onClick={() => setInvPage(prev => Math.max(1, prev - 1))}
                    >
                      ◀ Previous
                    </button>
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>
                      Page {invPage} of {totalInvPages}
                    </span>
                    <button
                      className="secondary-btn"
                      disabled={invPage === totalInvPages}
                      onClick={() => setInvPage(prev => Math.min(totalInvPages, prev + 1))}
                    >
                      Next ▶
                    </button>
                  </div>
                </div>

                {/* Right Side: Detailed Panel */}
                {selectedItem && (
                  <div className="details-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                      <span className="badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent)', fontWeight: 'bold' }}>
                        {selectedItem.category}
                      </span>
                      <h3 style={{ fontSize: '18px', fontWeight: '700', marginTop: '8px', color: 'var(--text-heading)' }}>
                        {selectedItem.name}
                      </h3>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'monospace' }}>
                        Item Code: {selectedItem.code}
                      </div>
                    </div>

                    {/* Dynamic Metrics */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Average Age</div>
                        <div style={{ fontSize: '16px', fontWeight: '800', marginTop: '4px', color: 'var(--text-main)' }}>
                          {selectedItem.category === 'Finished Goods' ? '4.50 days' : '0.00 days'}
                        </div>
                      </div>
                      <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Time to Produce</div>
                        <div style={{ fontSize: '16px', fontWeight: '800', marginTop: '4px', color: 'var(--text-main)' }}>
                          {selectedItem.category === 'Finished Goods' ? (selectedItem.code.includes('RUM') ? '12.50 mins' : '8.00 mins') : '-'}
                        </div>
                      </div>
                    </div>

                    {/* Trending Sparklines - Show only for Finished Goods */}
                    {selectedItem.category === 'Finished Goods' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                            <span style={{ fontWeight: '500' }}>Production Trend (7d)</span>
                            <span style={{ color: 'var(--success)', fontWeight: '600' }}>+12.4%</span>
                          </div>
                          <div style={{ height: '40px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '6px', overflow: 'hidden', padding: '4px' }}>
                            <svg width="100%" height="100%" viewBox="0 0 100 30" preserveAspectRatio="none">
                              <path
                                d="M 0 25 Q 15 15 30 20 T 60 10 T 90 5"
                                fill="none"
                                stroke="var(--success)"
                                strokeWidth="2"
                              />
                            </svg>
                          </div>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                            <span style={{ fontWeight: '500' }}>Consumption / Forecast</span>
                            <span style={{ color: 'var(--warning)', fontWeight: '600' }}>Balanced</span>
                          </div>
                          <div style={{ height: '40px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '6px', overflow: 'hidden', padding: '4px' }}>
                            <svg width="100%" height="100%" viewBox="0 0 100 30" preserveAspectRatio="none">
                              <path
                                d="M 0 20 Q 25 15 50 25 T 100 12"
                                fill="none"
                                stroke="var(--warning)"
                                strokeWidth="2"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Status Card */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Current Level:</span>
                        <strong style={{ color: 'var(--text-main)' }}>{selectedItem.qty.toFixed(2)} {selectedItem.unit}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Safety Stock Limit:</span>
                        <strong style={{ color: 'var(--text-main)' }}>{selectedItem.minLevel.toFixed(2)} {selectedItem.unit}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Storage Area:</span>
                        <strong style={{ color: 'var(--text-main)' }}>
                          {selectedItem.category === 'Finished Goods' ? 'Finished Goods WH' : 'Raw Materials WH'}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
}