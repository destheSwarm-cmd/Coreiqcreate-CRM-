import React, { useState } from 'react';
import {
  Product,
  ProductOption,
  PriceTier,
  ProductRelation,
  CrmSettings,
} from '../types/crm';
import { computeLinePrice } from '../shared/pricingEngine';
import {
  Package,
  AlertTriangle,
  Calculator,
  Sliders,
  DollarSign,
  Plus,
  Edit2,
  Check,
  ArrowRight,
  TrendingUp,
  Tag,
} from 'lucide-react';

interface PriceBookViewProps {
  products: Product[];
  options: ProductOption[];
  tiers: PriceTier[];
  relations: ProductRelation[];
  settings: CrmSettings;
  onUpdateProduct: (product: Product) => void;
  onAddProduct: (product: Partial<Product>) => void;
}

export const PriceBookView: React.FC<PriceBookViewProps> = ({
  products,
  options,
  tiers,
  relations,
  settings,
  onUpdateProduct,
  onAddProduct,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>('');

  // Simulator State
  const [simProductId, setSimProductId] = useState<string>(products[0]?.id || '');
  const [simQty, setSimQty] = useState<number>(1);
  const [simDiscount, setSimDiscount] = useState<number>(0);
  const [simActor, setSimActor] = useState<'human' | 'agent'>('human');
  const [simSelectedOptions, setSimSelectedOptions] = useState<string[]>([]);

  const categories = Array.from(new Set(products.map((p) => p.category)));
  const unpricedProducts = products.filter((p) => p.needs_price || p.base_price === null);

  const filteredProducts = products.filter(
    (p) => selectedCategory === 'all' || p.category === selectedCategory
  );

  // Run simulator calculation
  const selectedSimProduct = products.find((p) => p.id === simProductId) || products[0];
  const simCalculation = selectedSimProduct
    ? computeLinePrice({
        product: selectedSimProduct,
        quantity: simQty,
        optionsSelected: simSelectedOptions.map((optId) => ({ optionId: optId })),
        allOptions: options.filter((o) => o.product_id === selectedSimProduct.id),
        tiers: tiers.filter((t) => t.product_id === selectedSimProduct.id),
        discountPct: simDiscount,
        actorType: simActor,
        settings,
      })
    : null;

  const handleSavePrice = (prod: Product) => {
    const val = parseFloat(editingPrice);
    if (!isNaN(val) && val >= 0) {
      onUpdateProduct({
        ...prod,
        base_price: val,
        needs_price: false,
      });
    }
    setEditingId(null);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#04091A] text-slate-100 space-y-6">
      {/* HEADER & SUMMARY */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-cyan-400" />
            <span>Product Catalog & Price Book</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            "Our stock is software" — products, hourly tiers, add-ons, and dynamic upsell relationships.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#0a1329] text-xs text-slate-200 border border-[#1e325c] rounded px-3 py-1.5 focus:outline-none"
          >
            <option value="all">All Categories ({products.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* UNPRICED PRODUCTS ALERT BANNER */}
      {unpricedProducts.length > 0 && (
        <div className="p-4 bg-amber-950/40 border border-amber-800/80 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-amber-300 text-xs">
              {unpricedProducts.length} Product(s) Marked "NEEDS PRICE"
            </div>
            <p className="text-[11px] text-amber-200/80 mt-0.5 leading-relaxed">
              Per commercial rules, no quote can be sent to clients while containing unpriced line items.
              Set real base prices below:
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {unpricedProducts.map((p) => (
                <span
                  key={p.id}
                  className="font-mono text-[10px] text-amber-300 bg-amber-900/60 border border-amber-700 px-2 py-0.5 rounded"
                >
                  {p.sku} ({p.name})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TWO-COLUMN LAYOUT: SPREADSHEET CATALOG & SIMULATOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Spreadsheet Table (2/3 width) */}
        <div className="lg:col-span-2 bg-[#081126] border border-[#162445] rounded-lg overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-[#162445] bg-[#0a142e] flex items-center justify-between">
            <span className="font-bold text-xs text-white uppercase tracking-wider">Product Inventory (Software)</span>
            <span className="text-[11px] text-slate-400 font-mono">Currency: {settings.currency}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#162445] bg-[#060c1d] text-slate-400 uppercase font-mono text-[10px]">
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Name / Category</th>
                  <th className="py-2.5 px-3">Model</th>
                  <th className="py-2.5 px-3 text-right">Base Price</th>
                  <th className="py-2.5 px-3 text-right">Min Price</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#162445]/60">
                {filteredProducts.map((prod) => {
                  const isEditing = editingId === prod.id;
                  const isUnpriced = prod.needs_price || prod.base_price === null;

                  return (
                    <tr key={prod.id} className="hover:bg-[#0c1836] transition-colors">
                      <td className="py-2.5 px-3 font-mono text-cyan-400 text-[11px]">
                        {prod.sku}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-100">{prod.name}</div>
                        <div className="text-[10px] text-slate-500">{prod.category}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 capitalize font-mono text-[11px]">
                        {prod.pricing_model}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              autoFocus
                              value={editingPrice}
                              onChange={(e) => setEditingPrice(e.target.value)}
                              className="w-20 bg-slate-900 text-xs text-right text-white border border-cyan-500 rounded px-1.5 py-0.5"
                            />
                            <button
                              onClick={() => handleSavePrice(prod)}
                              className="p-1 text-emerald-400 hover:text-emerald-300"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : isUnpriced ? (
                          <span className="font-mono text-[10px] font-bold text-amber-400 bg-amber-950/80 border border-amber-800 px-1.5 py-0.5 rounded">
                            NEEDS PRICE
                          </span>
                        ) : (
                          <span className="font-bold text-slate-200">
                            {prod.base_price?.toLocaleString()} {prod.currency}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                        {prod.min_price ? `${prod.min_price} ${prod.currency}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            setEditingId(prod.id);
                            setEditingPrice(prod.base_price ? String(prod.base_price) : '');
                          }}
                          className="px-2 py-1 text-[10px] font-semibold text-cyan-400 bg-cyan-950 border border-cyan-800 rounded hover:bg-cyan-900"
                        >
                          Edit Price
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Pricing Simulator & Upsell Rules (1/3 width) */}
        <div className="space-y-6">
          {/* Simulator Box */}
          <div className="bg-[#081126] border border-[#162445] rounded-lg p-4 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 pb-2 border-b border-[#162445]">
              <Calculator className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-white">Central Price Test Simulator</h3>
            </div>

            {/* Select Product */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Product / SKU:</label>
              <select
                value={simProductId}
                onChange={(e) => setSimProductId(e.target.value)}
                className="w-full bg-[#0a1329] text-xs text-slate-200 border border-[#1e325c] rounded p-2 focus:outline-none"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity & Discount */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Quantity:</label>
                <input
                  type="number"
                  min="1"
                  value={simQty}
                  onChange={(e) => setSimQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-[#0a1329] text-xs text-slate-200 border border-[#1e325c] rounded p-2 text-center font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Discount %:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={simDiscount}
                  onChange={(e) => setSimDiscount(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                  className="w-full bg-[#0a1329] text-xs text-slate-200 border border-[#1e325c] rounded p-2 text-center font-mono"
                />
              </div>
            </div>

            {/* Actor Type */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Priced By Actor:</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSimActor('human')}
                  className={`flex-1 py-1 rounded text-xs border font-medium ${
                    simActor === 'human'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                      : 'bg-slate-900 text-slate-400 border-slate-700'
                  }`}
                >
                  Human (Cap: {settings.approval_threshold_pct}%)
                </button>
                <button
                  type="button"
                  onClick={() => setSimActor('agent')}
                  className={`flex-1 py-1 rounded text-xs border font-medium ${
                    simActor === 'agent'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                      : 'bg-slate-900 text-slate-400 border-slate-700'
                  }`}
                >
                  Agent (Cap: {settings.agent_discount_cap_pct}%)
                </button>
              </div>
            </div>

            {/* Simulator Output */}
            {simCalculation && (
              <div className="p-3 bg-[#050b1a] border border-[#162445] rounded space-y-2 font-mono text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Rule:</span>
                  <span className="text-slate-200 truncate ml-2">{simCalculation.unitPriceRule}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Unit Price:</span>
                  <span>{simCalculation.unitPrice} {selectedSimProduct.currency}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Gross:</span>
                  <span>{simCalculation.grossSubtotal} {selectedSimProduct.currency}</span>
                </div>
                {simCalculation.discountPct > 0 && (
                  <div className="flex justify-between text-amber-400">
                    <span>Discount ({simCalculation.discountPct}%):</span>
                    <span>-{simCalculation.discountAmount} {selectedSimProduct.currency}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-cyan-400 border-t border-slate-800 pt-2">
                  <span>Line Total:</span>
                  <span>{simCalculation.lineTotal} {selectedSimProduct.currency}</span>
                </div>

                {/* Approval Requirement Warning */}
                {simCalculation.approvalRequired && (
                  <div className="mt-2 p-2 bg-red-950/60 border border-red-800 rounded text-red-300 text-[11px] leading-tight font-sans">
                    <strong>Approval Block:</strong> {simCalculation.approvalReason}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Product Relations (Upsell Drivers) */}
          <div className="bg-[#081126] border border-[#162445] rounded-lg p-4 space-y-3 shadow-sm">
            <h3 className="font-bold text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Upsell & Cross-Sell Rules</span>
            </h3>
            <div className="space-y-2">
              {relations.map((rel) => {
                const fromP = products.find((p) => p.id === rel.from_product_id);
                const toP = products.find((p) => p.id === rel.to_product_id);

                return (
                  <div key={rel.id} className="p-2.5 bg-[#0a1329] border border-[#162445] rounded text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-200">{fromP?.name}</span>
                      <ArrowRight className="w-3 h-3 text-cyan-400" />
                      <span className="font-bold text-emerald-400">{toP?.name}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">{rel.reason}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
