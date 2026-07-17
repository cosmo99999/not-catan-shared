import { getVertice } from "./methods.js";

export * from "./methods.js";
const offsets: [number, number][] = [[0, -1], [1, -1], [1, 0], [0, 1], [-1, 1], [-1, 0]];
const tilePositon: [number, number][] = [
  [0, 0], [0, -1], [1, -1], [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -2], [1, -2],
  [2, -2], [2, -1], [2, 0], [1, 1], [0, 2], [-1, 2], [-2, 2], [-2, 1], [-2, 0], [-1, -1]
]
const possiblenumbers = [2, 12, 11, 11, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10];
const possilberesources = [0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4];
const portNums = [0, 1, 2, 3, 4, 5, 5, 5, 5];
const portSpacings = [3, 4, 3, 3, 3, 3, 3, 4, 3];
const portVertexOrderedIds = [26, 27, 24, 25, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 52, 50, 53];

const size = 65;
function hexCorner(q: number, r: number, i: number) {
  const { x: cx, y: cy } = axialToPixel(q, r);
  const angleDeg = 60 * i - 30; // pointy-top: corners at 30°, 90°, 150°...
  const angleRad = (Math.PI / 180) * angleDeg;
  return {
    x: cx! + size * Math.cos(angleRad),
    y: cy! + size * Math.sin(angleRad),
  };
}
export function axialToPixel(q: number, r: number) {
  return {
    x: size * Math.sqrt(3) * (q + r / 2),
    y: size * 1.5 * r,
  };
}
function tileKey(q: number, r: number): string {
  return `${q},${r}`;
}
function vertKey(q: number, r: number, k: number): string {
  const [qO1, r01] = offsets[k]!;
  const [qO2, r02] = offsets[(k + 1) % 6]!;
  const neighbours = [
    tileKey(q, r),
    tileKey(q + qO1, r + r01),
    tileKey(q + qO2, r + r02),
  ]
  return neighbours.sort().join("|");
}
function edgeKey(q: number, r: number, k: number): string {
  const [qO1, r01] = offsets[k]!;
  const neighbours = [
    tileKey(q, r),
    tileKey(q + qO1, r + r01),
  ]
  return neighbours.sort().join("|");
}
export function getRandomInt(min: number, max: number): number {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  // The maximum is exclusive and the minimum is inclusive
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
}
export enum GameState {
  PreRoll,
  Discard,
  RobberPlacing,
  Stealing,
  Turn,
}
export enum Resource {
  Brick,
  Wood,
  Sheep,
  Wheat,
  Ore,
  None,
}
export enum StructureType {
  Settlement,
  City,
  Road,
  None
}
export enum Purchase {
  Road,
  Settlement,
  City,
  DevCard
}
export enum Colour {
  Blue,
  Orange,
  Red,
  White
}
export enum DevCardType {
  Knight,
  RoadBuilding,
  YearOfPlenty,
  Monopoly,
  VP,
}
export interface DevCard {
  id: number;
  type: DevCardType;
}
export interface Structure {
  id: number;
  type: StructureType;
  colour: Colour;
  playerId: number;
}
export interface Port {
  id: number;
  rate: number;
  resource: Resource;
}
export interface Edge {
  id: number;
  verticeIds: [number, number];
  tileIds: number[];
  structure?: Structure;
  highlighted: boolean;
}
export interface Tile {
  id: number;
  r: number;
  q: number;
  edgeIds: number[];
  verticeIds: number[];
  resource: Resource;
  value: number;
  robber: boolean;
  xPos: number;
  yPos: number;
  highlighted: boolean;
}
export interface Vertice {
  id: number;
  edgeIds: number[];
  portId: number;
  tileIds: number[];
  structure?: Structure;
  xPos: number;
  yPos: number;
  highlighted: boolean;
}
export interface Player {
  id: number;
  name?: string;
  victoryPoints: number;
  colour: Colour;
  structureIds: number[];
  resources: Resource[];
  devCards: DevCard[];
  playedDevCards: DevCard[];
}
export interface Game {
  structureIdCounter: number;
  tiles: Tile[];
  vertices: Vertice[];
  edges: Edge[];
  players: Player[];
  ports: Port[];
  structures: Structure[];
  devCards: DevCard[];
  currentTurnPlayerId?: number;
  gameState: GameState;
}
export function getEmptyGame(): Game {
  return { tiles: [], structures: [], edges: [], vertices: [], players: [], ports: [], devCards: [], gameState: GameState.PreRoll, structureIdCounter: 0 };
}
export function buildBoard(game: Game): Game {
  const tiles: Tile[] = [];
  const vertexLookup = new Map<string, Vertice>();
  const edgeLookup = new Map<string, Edge>();
  let nextEId = 0;
  let nextVId = 0;

  tilePositon.forEach(([q, r], i) => {
    const tile: Tile = {
      id: i,
      q: q,
      r: r,
      edgeIds: [],
      verticeIds: [],
      resource: 0,
      value: 0,
      robber: false,
      xPos: 0,
      yPos: 0,
      highlighted: false,
    };
    const { x: xp, y: yp } = axialToPixel(q, r)!;
    tile.xPos = xp;
    tile.yPos = yp;
    const cornerVerts: Vertice[] = [];

    for (let k = 0; k < 6; k++) {
      const key = vertKey(q, r, k)
      let v = vertexLookup.get(key);
      if (!v) {
        v = { id: nextVId++, edgeIds: [], tileIds: [], xPos: 0, yPos: 0, highlighted: false, portId: -1 };
        const { x: vxp, y: vyp } = hexCorner(q, r, (k + 5) % 6);
        v.xPos = vxp;
        v.yPos = vyp;
        vertexLookup.set(key, v);
      }
      v.tileIds.push(tile.id);
      tile.verticeIds.push(v.id);
      cornerVerts.push(v);
    }
    for (let k = 0; k < 6; k++) {
      const key = edgeKey(q, r, k)
      let e = edgeLookup.get(key);
      if (!e) {
        let v1 = cornerVerts[(k + 5) % 6];
        let v2 = cornerVerts[k];
        e = { id: nextEId++, verticeIds: [-1, -1], tileIds: [], highlighted: false };
        edgeLookup.set(key, e);
        e.verticeIds[0] = v1.id;
        e.verticeIds[1] = v2.id;
        v1?.edgeIds.push(e.id);
        v2?.edgeIds.push(e.id);
      }
      e.tileIds.push(tile.id);
      tile.edgeIds.push(e.id);
    }
    tiles.push(tile);
  });

  let devCardCounter = 0;
  for (let i = 0; i < 25; i++) {
    if (i < 14) {
      game.devCards.push({ id: devCardCounter++, type: DevCardType.Knight });
    } else if (i < 19) {
      game.devCards.push({ id: devCardCounter++, type: DevCardType.VP });
    } else if (i < 21) {
      game.devCards.push({ id: devCardCounter++, type: DevCardType.RoadBuilding });
    } else if (i < 23) {
      game.devCards.push({ id: devCardCounter++, type: DevCardType.Monopoly });
    } else {
      game.devCards.push({ id: devCardCounter++, type: DevCardType.YearOfPlenty });
    }
  }
  game.tiles = tiles;
  game.edges = [...edgeLookup.values()];
  game.vertices = [...vertexLookup.values()];
  return game;
}
export function randomizeBoard(game: Game): Game {
  const numbers: number[] = [...possiblenumbers];
  const resources: number[] = [...possilberesources];
  const tileOffset = getRandomInt(0, 10);
  for (let i = 0; i < game.tiles.length; i++) {
    const t = game.tiles[(i + tileOffset) % (game.tiles.length)]!;
    if (numbers.length == 0) {
      t.resource = Resource.None;
      t.value = -1;
      t.robber = true;
    } else {
      let nIndex = getRandomInt(0, numbers.length);
      let rIndex = getRandomInt(0, resources.length);

      const n = numbers[nIndex];
      const r = resources[rIndex];

      t.resource = r!;
      t.value = n!;

      numbers.splice(nIndex, 1);
      resources.splice(rIndex, 1);
    }
  };
  let portIdCounter = 0;
  const portsNumbers = [...portNums];
  const verticeNums = [...portVertexOrderedIds];
  const spacings = [...portSpacings];
  const offset = getRandomInt(0, 10);
  let counter = 0;
  for (let i = 0; i < verticeNums.length;) {
    if (portsNumbers.length == 0) break;
    const v1 = game.vertices.find(v => v.id == verticeNums[(i + offset) % verticeNums.length])!;
    const v2 = game.vertices.find(v => v.id == verticeNums[(i + offset + 1) % verticeNums.length])!;
    const pIndex = getRandomInt(0, portsNumbers.length);
    const resource = portsNumbers[pIndex]!;
    portsNumbers.splice(pIndex, 1);
    let value = -1;
    if (resource !== 5) {
      value = 2;
    } else {
      value = 3;
    }
    const p = { id: portIdCounter++, rate: value, resource: resource };
    v1.portId = p.id;
    v2.portId = p.id;
    game.ports.push(p);

    const sIndex = getRandomInt(0, spacings.length);
    const s = spacings[sIndex]!;
    i += s;
    spacings.splice(sIndex, 1);
  }
  return game;
}

export function seed(game: Game): Game {
  const p1: Player = { id: 0, colour: Colour.Blue, victoryPoints: 0, structureIds: [], resources: [], devCards: [], playedDevCards: [] };
  const p2: Player = { id: 1, colour: Colour.White, victoryPoints: 0, structureIds: [], resources: [], devCards: [], playedDevCards: [] };
  const p3: Player = { id: 2, colour: Colour.Orange, victoryPoints: 0, structureIds: [], resources: [], devCards: [], playedDevCards: [] };
  const p4: Player = { id: 3, colour: Colour.Red, victoryPoints: 0, structureIds: [], resources: [], devCards: [], playedDevCards: [] };

  p1.name = "rory";
  p2.name = "alec";
  p3.name = "milo";
  p4.name = "ham";
  p1.resources.push(Resource.Brick);
  p1.resources.push(Resource.Sheep);
  p1.resources.push(Resource.Wood);
  p1.resources.push(Resource.Wheat);
  p2.resources.push(Resource.Sheep);
  p2.resources.push(Resource.Sheep);
  p2.resources.push(Resource.Ore);
  game.players.push(p1);
  game.players.push(p2);
  game.players.push(p3);
  game.players.push(p4);
  game.currentTurnPlayerId = p1.id;
  return game;
}
// export function gametoJSON(game: Game): any {
//   return {
//     Tiles: game.tiles.map(t => t.toJSON()),
//     Vertices: game.vertices.map(v => v.toJSON()),
//     Edges: game.edges.map(e => e.toJSON()),
//     Players: game.players.map(p => p.toJSON()),
//     Ports: game.ports.map(p => p.toJSON()),
//     Structures: game.structures.map(s => s.toJSON()),
//     devCards: game.devCards,
//     gameState: game.gameState,
//     currentTurnPlayerId: game.currentTurnPlayerId
//   }
// }
// export function buildFromJSON(game: any): Game {
//
//   let g = getEmptyGame();
//   const tiles = game.Tiles;
//   const vertices = game.Vertices;
//   const edges = game.Edges;
//   const ports = game.Ports;
//   const structures = game.Structures;
//   const devCards = game.devCards;
//   const players = game.Players;
//   g.currentTurnPlayerId = game.currentTurnPlayerId;
//
//   const tileMap = new Map<number, Tile>();
//   const verticeMap = new Map<number, Vertice>();
//   const edgeMap = new Map<number, Edge>();
//   const portMap = new Map<number, Port>();
//   const structureMap = new Map<number, Structure>();
//
//   for (let i = 0; i < tiles.length; i++) {
//     const data = tiles[i];
//     const t = new Tile(data.id, data.q, data.r);
//     tileMap.set(t.id, t);
//   }
//   for (let i = 0; i < structures.length; i++) {
//     const data = structures[i];
//     const player = g.players.find(p => p.id == data.playerId)!;
//     const t = new Structure(data.colour, data.type, player);
//     structureMap.set(t.id, t);
//   }
//   for (let i = 0; i < ports.length; i++) {
//     const data = ports[i];
//     const t = new Port(data.id, data.rate, data.resource);
//     portMap.set(t.id, t);
//   }
//   for (let i = 0; i < vertices.length; i++) {
//     const data = vertices[i];
//     const v = new Vertice(data.id);
//     verticeMap.set(v.id, v);
//   }
//   for (let i = 0; i < edges.length; i++) {
//     const data = edges[i];
//     const vIds = data.vertexIds;
//     const e = new Edge(data.id, verticeMap.get(vIds[0])!, verticeMap.get(vIds[1])!);
//     edgeMap.set(e.id, e);
//   }
//
//   for (const p of players) {
//     const pl = new Player(p.id, p.colour);
//     pl.devCards = p.devCards;
//     pl.structures = p.structureIds.map((id: number) => structureMap.get(id));
//     pl.resources = p.resources;
//     pl.name = p.name;
//     g.players.push(pl);
//   }
//   for (const t of tiles) {
//     const tile = tileMap.get(t.id)!;
//     tile.resource = t.resource;
//     tile.value = t.value;
//     tile.xPos = t.xPos;
//     tile.yPos = t.yPos;
//     tile.highlighted = t.highlighted;
//     tile.vertices = t.vertexIds.map((id: number) => verticeMap.get(id));
//     tile.edges = t.edgeIds.map((id: number) => edgeMap.get(id));
//   }
//   for (const v of vertices) {
//     const vertice = verticeMap.get(v.id)!;
//     vertice.xPos = v.xPos;
//     vertice.yPos = v.yPos;
//     if (v.portId !== undefined) {
//       vertice.port = portMap.get(v.portId);
//     } else {
//       vertice.port = undefined;
//     }
//     vertice.tiles = v.tileIds.map((id: number) => tileMap.get(id));
//     vertice.highlighted = v.highlighted;
//     vertice.structure = structureMap.get(v.structureId);
//     vertice.edges = v.edgeIds.map((id: number) => edgeMap.get(id));
//   }
//   for (const e of edges) {
//     const edge = edgeMap.get(e.id)!;
//     edge.structure = e.structure;
//     edge.highlighted = e.highlighted;
//     edge.tiles = e.tileIds.map((id: number) => tileMap.get(id));
//     edge.vertices = e.vertexIds.map((id: number) => verticeMap.get(id));
//   }
//
//   g.tiles = [...tileMap.values()];
//   g.vertices = [...verticeMap.values()];
//   g.edges = [...edgeMap.values()];
//   g.ports = ports;
//   g.structures = structures;
//   g.devCards = devCards;
//   return g;
//
// }
