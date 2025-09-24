import React, { useCallback, useMemo, useState } from 'react';

// --- Types ---
export type GridType = 'hex' | 'square' | 'tri';

export interface ShapeStats {
  hp: number;
  offense: number;
  defense: number;
  terrainAffinity?: string[]; // future extension
}

export interface ShapeCell { q: number; r: number } // axial for hex; for square we map q->x r->y

export interface ShapeDefinition {
  id: string;
  name: string;
  baseCells: ShapeCell[]; // relative to (0,0)
  stats: ShapeStats;
  category?: string;
  maxRotations?: number; // override defaults
  allowReflection?: boolean;
  gridType?: GridType; // if shape only valid for certain grid
}

export interface PlacedShape {
  id: string; // uuid or composed id
  shapeId: string;
  playerId: string;
  origin: ShapeCell; // anchor cell
  rotation: number; // discrete rotation index
  reflected: boolean;
  cells: ShapeCell[]; // absolute occupied cells
  stats: ShapeStats;
}

export interface ContestedCell {
  key: string; // coordinate key
  attackers: Set<string>; // playerIds attempting to occupy
}

export interface BattlefieldState {
  shapes: PlacedShape[];
  contested: Record<string, ContestedCell>;
}

export interface BattlefieldProps {
  width: number; // grid width in axial q (or x)
  height: number; // grid height in axial r (or y)
  gridType?: GridType;
  playerId: string; // current local player
  initialState?: BattlefieldState;
  shapeCatalog?: ShapeDefinition[];
  onStateChange?: (state: BattlefieldState) => void;
  interactive?: boolean;
}

// --- Default Shapes (polyomino / polyhex samples) ---
const DEFAULT_SHAPES: ShapeDefinition[] = [
  {
    id: 'hex_trio',
    name: 'Hex Trio',
    baseCells: [ { q:0, r:0 }, { q:1, r:0 }, { q:0, r:1 } ],
    stats: { hp: 6, offense: 2, defense: 2 },
    category: 'formation',
    allowReflection: true,
  },
  {
    id: 'hex_line3',
    name: 'Spear Line',
    baseCells: [ { q:0, r:0 }, { q:1, r:0 }, { q:2, r:0 } ],
    stats: { hp: 5, offense: 3, defense: 1 },
    category: 'attack',
  },
  {
    id: 'square_L',
    name: 'L Polyomino',
    baseCells: [ { q:0, r:0 }, { q:0, r:1 }, { q:0, r:2 }, { q:1, r:2 } ],
    stats: { hp: 7, offense: 2, defense: 3 },
    category: 'defense',
    gridType: 'square',
    allowReflection: true,
  }
];

// --- Utility Functions ---
const axialKey = (q:number,r:number) => `${q},${r}`;

// Hex axial neighbor directions
const HEX_DIRS: ShapeCell[] = [
  { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
  { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
];

// For square grid (including vertex touch) we include 8 directions
const SQUARE_DIRS: ShapeCell[] = [
  { q:1,r:0 },{ q:-1,r:0 },{ q:0,r:1 },{ q:0,r:-1 },
  { q:1,r:1 },{ q:1,r:-1 },{ q:-1,r:1 },{ q:-1,r:-1 }
];

// Rotate hex axial coordinate 60° steps (about origin)
function rotateHex(cell: ShapeCell, steps: number): ShapeCell {
  // steps 0..5; formula sequence
  let { q, r } = cell;
  let s = -q - r;
  steps = ((steps % 6) + 6) % 6;
  for (let i=0;i<steps;i++) {
    // (q,r,s) -> (-r, -s, -q)
    const nq = -r;
    const nr = -s;
    s = -nq - nr;
    q = nq; r = nr;
  }
  return { q, r };
}

// Reflect hex across q axis
function reflectHex(cell: ShapeCell): ShapeCell {
  const { q, r } = cell;
  return { q, r: -q - r };
}

// Rotate square coordinate 90° steps
function rotateSquare(cell: ShapeCell, steps: number): ShapeCell {
  steps = ((steps % 4)+4)%4;
  let { q:x, r:y } = cell;
  for (let i=0;i<steps;i++) {
    const nx = -y; const ny = x; x=nx; y=ny;
  }
  return { q:x, r:y };
}

function reflectSquare(cell: ShapeCell): ShapeCell {
  return { q: -cell.q, r: cell.r };
}

function transformShape(base: ShapeCell[], gridType: GridType, rotation: number, reflected: boolean): ShapeCell[] {
  return base.map(c => {
    let t: ShapeCell = { ...c };
    if (reflected) {
      t = gridType === 'hex' ? reflectHex(t) : reflectSquare(t);
    }
    t = gridType === 'hex' ? rotateHex(t, rotation) : rotateSquare(t, rotation);
    return t;
  });
}

// (Reserved) normalize function if future canonical shape hashing needed

// Determine adjacency (touch by edge or vertex) between newCells and friendlyCells
function hasFriendlyAdjacency(newCells: ShapeCell[], friendlyCells: Set<string>, dirs: ShapeCell[]): boolean {
  for (const c of newCells) {
    if (friendlyCells.has(axialKey(c.q, c.r))) return true; // overlapping existing friendly (rare) counts
    for (const d of dirs) {
      const k = axialKey(c.q + d.q, c.r + d.r);
      if (friendlyCells.has(k)) return true;
    }
  }
  return false;
}

// --- Component ---
export const Battlefield: React.FC<BattlefieldProps> = ({
  width,
  height,
  gridType = 'hex',
  playerId,
  initialState,
  shapeCatalog,
  onStateChange,
  interactive = true,
}) => {
  const [state, setState] = useState<BattlefieldState>(initialState || { shapes: [], contested: {} });
  const [selectedShapeId, setSelectedShapeId] = useState<string>('hex_trio');
  const [rotation, setRotation] = useState(0);
  const [reflected, setReflected] = useState(false);

  const catalog = useMemo(() => (shapeCatalog || DEFAULT_SHAPES).filter(s => !s.gridType || s.gridType === gridType), [shapeCatalog, gridType]);
  const selectedShape = catalog.find(s => s.id === selectedShapeId) || catalog[0];

  const friendlyCells = useMemo(() => {
    const set = new Set<string>();
    state.shapes.filter(s => s.playerId === playerId).forEach(s => s.cells.forEach(c => set.add(axialKey(c.q,c.r))));
    return set;
  }, [state.shapes, playerId]);

  const enemyCells = useMemo(() => {
    const set = new Set<string>();
    state.shapes.filter(s => s.playerId !== playerId).forEach(s => s.cells.forEach(c => set.add(axialKey(c.q,c.r))));
    return set;
  }, [state.shapes, playerId]);

  const dirs = gridType === 'hex' ? HEX_DIRS : SQUARE_DIRS; // tri TODO

  const attemptPlacement = useCallback((origin: ShapeCell) => {
    if (!selectedShape) return;
    const transformed = transformShape(selectedShape.baseCells, gridType, rotation, reflected);
    // shift by origin
    const absCells = transformed.map(c => ({ q: origin.q + c.q, r: origin.r + c.r }));
    // bounds check
    if (absCells.some(c => c.q < 0 || c.q >= width || c.r < 0 || c.r >= height)) return; // out of bounds silently ignored
    const contested: Record<string, ContestedCell> = { ...state.contested };
    // Overlaps
    const overlapEnemy = absCells.filter(c => enemyCells.has(axialKey(c.q,c.r)));
    if (overlapEnemy.length > 0) {
      // mark contested cells
      overlapEnemy.forEach(c => {
        const key = axialKey(c.q,c.r);
        if (!contested[key]) contested[key] = { key, attackers: new Set() };
        contested[key].attackers.add(playerId);
      });
      // do not place shape if overlap for now
      setState(prev => ({ ...prev, contested }));
      onStateChange?.({ ...state, contested });
      return;
    }
    // adjacency rule: if player has no shapes yet allow; else must touch (edge or vertex)
    if (friendlyCells.size > 0 && !hasFriendlyAdjacency(absCells, friendlyCells, dirs)) {
      return; // invalid placement (no adjacency)
    }
    const newShape: PlacedShape = {
      id: `${selectedShape.id}_${Date.now()}`,
      shapeId: selectedShape.id,
      playerId,
      origin,
      rotation,
      reflected,
      cells: absCells,
      stats: selectedShape.stats,
    };
    const newState: BattlefieldState = { shapes: [...state.shapes, newShape], contested };
    setState(newState);
    onStateChange?.(newState);
  }, [selectedShape, gridType, rotation, reflected, width, height, enemyCells, friendlyCells, dirs, playerId, state, onStateChange]);

  // --- Rendering Helpers ---
  const hexSize = 24;
  const sqrt3 = Math.sqrt(3);
  function hexToPixel(q:number, r:number) {
    const x = hexSize * (3/2 * q);
    const y = hexSize * (sqrt3/2 * q + sqrt3 * r);
    return { x, y };
  }

  const gridCells = useMemo(() => {
    const cells: ShapeCell[] = [];
    for (let q=0;q<width;q++) {
      for (let r=0;r<height;r++) {
        cells.push({ q, r });
      }
    }
    return cells;
  }, [width, height]);

  const occupiedMap = useMemo(() => {
    const map: Record<string, PlacedShape[]> = {};
    state.shapes.forEach(s => s.cells.forEach(c => {
      const k = axialKey(c.q,c.r);
      if (!map[k]) map[k] = [];
      map[k].push(s);
    }));
    return map;
  }, [state.shapes]);

  // Preview placement under cursor when a shape is selected
  const [hoverCell, setHoverCell] = useState<ShapeCell | null>(null);
  const previewCells = useMemo(() => {
    if (!hoverCell || !selectedShape) return [];
    const transformed = transformShape(selectedShape.baseCells, gridType, rotation, reflected);
    return transformed.map(c => ({ q: hoverCell.q + c.q, r: hoverCell.r + c.r }));
  }, [hoverCell, selectedShape, gridType, rotation, reflected]);

  // --- UI Subcomponents ---
  const ShapePalette: React.FC = () => (
    <div className="flex flex-wrap gap-2 mb-2">
      {catalog.map(s => (
        <button
          key={s.id}
          className={`px-2 py-1 text-xs rounded border focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${s.id === selectedShapeId ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
          aria-pressed={s.id === selectedShapeId}
          aria-label={`Select shape ${s.name}`}
          onClick={() => { setSelectedShapeId(s.id); setRotation(0); setReflected(false); }}
        >{s.name}</button>
      ))}
      <div className="flex items-center gap-1 ml-2">
        <button className="px-2 py-1 text-xs border rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Rotate shape" onClick={()=>setRotation(r=>r+1)}>Rotate</button>
        {selectedShape?.allowReflection && (
          <button
            className={`px-2 py-1 text-xs border rounded relative overflow-hidden transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${reflected ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
            aria-pressed={reflected}
            aria-label="Toggle mirror"
            onClick={()=>setReflected(r=>!r)}
          >
            Mirror{reflected && <span className="absolute inset-0 pointer-events-none border-2 border-indigo-300/40 rounded animate-pulse" />}
          </button>
        )}
        <span className="text-xs text-gray-500">Rot: {rotation}</span>
      </div>
    </div>
  );

  function renderHexCell(cell: ShapeCell) {
    const { x, y } = hexToPixel(cell.q, cell.r);
    const size = hexSize;
    // NOTE: Using flat-top orientation angles (0°,60°,120°,180°,240°,300°) to match the
    // axial -> pixel conversion currently implemented (flat-top). Previously the points
    // used a 30° offset (pointy-top) which caused apparent misalignment.
    const points = [0, 60, 120, 180, 240, 300].map(deg => [
      x + size * Math.cos((Math.PI / 180) * deg),
      y + size * Math.sin((Math.PI / 180) * deg)
    ]);
    const key = axialKey(cell.q, cell.r);
    const occupied = occupiedMap[key];
    const isPreview = previewCells.some(pc => pc.q===cell.q && pc.r===cell.r);
    const contested = state.contested[key];
    const fill = occupied ? (occupied[0].playerId === playerId ? '#2563eb' : '#dc2626') : isPreview ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.05)';
    const stroke = contested ? '#f59e0b' : isPreview ? '#6366f1' : '#374151';
    const strokeDasharray = isPreview ? '4 3' : undefined;
    return (
      <polygon
        key={key}
        points={points.map(p=>p.join(',')).join(' ')}
        fill={fill}
        stroke={stroke}
        strokeWidth={contested ? 3 : isPreview ? 2 : 1}
        strokeDasharray={strokeDasharray}
        onMouseEnter={() => interactive && setHoverCell(cell)}
        onMouseLeave={() => interactive && setHoverCell(null)}
        onClick={() => interactive && attemptPlacement(cell)}
        className="cursor-pointer transition-colors duration-75"
      />
    );
  }

  function renderSquareCell(cell: ShapeCell) {
    const size = 32;
    const x = cell.q * size;
    const y = cell.r * size;
    const key = axialKey(cell.q, cell.r);
    const occupied = occupiedMap[key];
    const isPreview = previewCells.some(pc => pc.q===cell.q && pc.r===cell.r);
    const contested = state.contested[key];
    const fill = occupied ? (occupied[0].playerId === playerId ? '#2563eb' : '#dc2626') : isPreview ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.05)';
    const stroke = contested ? '#f59e0b' : isPreview ? '#6366f1' : '#374151';
    return (
      <rect
        key={key}
        x={x}
        y={y}
        width={size}
        height={size}
        fill={fill}
        stroke={stroke}
        strokeWidth={contested ? 3 : isPreview ? 2 : 1}
        strokeDasharray={isPreview ? '4 3' : undefined}
        onMouseEnter={() => interactive && setHoverCell(cell)}
        onMouseLeave={() => interactive && setHoverCell(null)}
        onClick={() => interactive && attemptPlacement(cell)}
        className="cursor-pointer transition-colors duration-75"
      />
    );
  }

  const svgContent = gridType === 'hex'
    ? gridCells.map(c => renderHexCell(c))
    : gridCells.map(c => renderSquareCell(c));

  const svgWidth = gridType === 'hex' ? hexToPixel(width-1, 0).x + hexSize * 2 : width * 32;
  const svgHeight = gridType === 'hex' ? hexToPixel(0, height-1).y + hexSize * 2.2 : height * 32;

  const friendlyCount = state.shapes.filter(s=>s.playerId===playerId).length;
  return (
    <div className="p-2 bg-gray-900 rounded shadow text-gray-100 w-full max-w-full overflow-auto">
      <h3 className="font-semibold mb-2">Battlefield ({gridType})</h3>
      {interactive && <ShapePalette />}
      <div className="flex gap-4 items-start flex-wrap">
        <div className="relative">
          <svg
            width={svgWidth}
            height={svgHeight}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="bg-gray-800 rounded border border-gray-700 shadow-inner"
            aria-label="Battlefield grid"
          >
            <rect x={0} y={0} width={svgWidth} height={svgHeight} fill="none" stroke="#4b5563" strokeWidth={1} strokeDasharray="6 6" />
            {svgContent}
          </svg>
          {friendlyCount === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-[11px] bg-gray-900/70 px-3 py-2 rounded border border-gray-700">
                Place your first formation anywhere.<br/>Subsequent shapes must be adjacent.
              </div>
            </div>
          )}
        </div>
        <div className="text-xs space-y-3 max-w-xs">
          <div>
            <p className="font-medium mb-1">Rules</p>
            <ul className="list-disc list-inside space-y-1 leading-snug">
              <li>First placement: anywhere inside the boundary.</li>
              <li>Afterward: must touch a friendly shape (edge or vertex).</li>
              <li>Enemy overlap creates contested cells (orange outline).</li>
              <li>Preview (dashed purple) shows current rotation/mirror.</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-1">Legend</p>
            <ul className="space-y-1">
              <li className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-blue-600 rounded-sm" /> Friendly</li>
              <li className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-red-600 rounded-sm" /> Enemy</li>
              <li className="flex items-center gap-1"><span className="inline-block w-3 h-3 border-2 border-orange-400" /> Contested</li>
              <li className="flex items-center gap-1"><span className="inline-block w-3 h-3 border border-indigo-400 bg-indigo-400/30" /> Preview</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-1">Selected Stats</p>
            {selectedShape && (
              <div className="grid grid-cols-3 gap-1">
                <div className="bg-gray-800/60 px-2 py-1 rounded text-center"><span className="text-[10px] block text-gray-400">HP</span>{selectedShape.stats.hp}</div>
                <div className="bg-gray-800/60 px-2 py-1 rounded text-center"><span className="text-[10px] block text-gray-400">ATK</span>{selectedShape.stats.offense}</div>
                <div className="bg-gray-800/60 px-2 py-1 rounded text-center"><span className="text-[10px] block text-gray-400">DEF</span>{selectedShape.stats.defense}</div>
              </div>
            )}
          </div>
          <div>
            <p className="font-medium mb-1">State</p>
            <p>Friendly: {friendlyCount}</p>
            <p>Enemy: {state.shapes.filter(s=>s.playerId!==playerId).length}</p>
            <p>Contested: {Object.keys(state.contested).length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Battlefield;
