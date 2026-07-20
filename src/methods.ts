import { DevCard, DevCardType, Edge, Game, GameState, getRandomInt, isEdge, Location, Player, Purchase, Resource, Structure, StructureType, Vertice } from "./model";
export function structureTypeToPurchase(type: StructureType): Purchase | null {
  switch (type) {
    case StructureType.Settlement: return Purchase.Settlement;
    case StructureType.City: return Purchase.City;
    case StructureType.Road: return Purchase.Road;
  }
  return null;
}
export function purchaseToStructureType(purchase: Purchase): StructureType | null {
  switch (purchase) {
    case Purchase.Settlement: return StructureType.Settlement;
    case Purchase.City: return StructureType.City;
    case Purchase.Road: return StructureType.Road;
  }
  return null;
}
export function devCardToGameState(dtype: DevCardType) {
  switch (dtype) {
    case DevCardType.RoadBuilding: return GameState.RoadBuilding;
    case DevCardType.YearOfPlenty: return GameState.YearOfPlenty;
    case DevCardType.Monopoly: return GameState.Monopoly;
    case DevCardType.Knight: return GameState.RobberPlacing;
  }
}
export function getVertice(id: number, game: Game) {
  return game.vertices.find(v => v.id == id);
}
export function getEdge(id: number, game: Game) {
  return game.edges.find(v => v.id == id);
}
export function getTile(id: number, game: Game) {
  return game.tiles.find(v => v.id == id);
}
export function getStructure(id: number, game: Game) {
  return game.structures.find(v => v.id == id);
}
export function getPlayer(id: number, game: Game) {
  return game.players.find(v => v.id == id);
}
export function getPort(id: number, game: Game) {
  return game.ports.find(v => v.id == id);
}
export function getDevCard(id: number, player: Player) {
  return player.devCards.find(d => d.id == id);

}
export function getAllStructuresByPlayer(id: number, game: Game) {
  return game.structures.filter((s: Structure) => (s.playerId == id))
}
export function getVerticesByList(ids: number[], game: Game) {
  const vertices = game.vertices.filter(v => ids.some(i => i == v.id));
  return vertices;
}
export function getEdgesByList(ids: number[], game: Game) {
  const edges = game.edges.filter(v => ids.some(i => i == v.id));
  return edges;
}
export function getEdgeAdjacentEdges(edge: Edge, game: Game): Edge[] {
  const vertices = getVerticesByList(edge.verticeIds, game);
  const edgeIds: number[] = [];
  vertices.forEach((v) => {
    v.edgeIds.forEach((e) => {
      edgeIds.push(e);
    })
  });
  const allEdges = getEdgesByList(edgeIds, game);
  return allEdges.filter(e => e.id !== edge.id);
}
export function getVerticeAdjacentVertices(vertice: Vertice, game: Game): Vertice[] {
  const edges = getEdgesByList(vertice.edgeIds, game);
  const verticeIds: number[] = [];
  edges.forEach((v) => {
    v.verticeIds.forEach((e) => {
      verticeIds.push(e);
    })
  });
  const allVertices = getVerticesByList(verticeIds, game);
  return allVertices.filter(e => e.id !== vertice.id);
}
function contains(array: number[], value: number) {
  if (array.some(v => v == value)) return true;
  return false;
}
function overlaps(array: number[], array2: number[]) {
  return array.some(a => array2.includes(a));
}
function isEdgeNearStructure(edge: Edge, game: Game): boolean {
  let vertices = getVerticesByList(edge.verticeIds, game);
  vertices.forEach((v) => {
    if (v.structureId !== -1) {
      return true;
    }
  })
  return false;
}
function isEdgeNearFriendlyStructure(edge: Edge, game: Game, pId: number): boolean {
  let vertices = getVerticesByList(edge.verticeIds, game);
  let result = false;
  vertices.forEach((v) => {
    const structure = getStructure(v.structureId, game);
    if (structure && structure.playerId == pId) {
      result = true;
    }
  })
  return result;
}
function isEdgeNearFriendlyRoad(edge: Edge, game: Game, pId: number): boolean {
  let edges = getEdgeAdjacentEdges(edge, game);
  let result = false;
  edges.forEach((e) => {
    const structure = getStructure(e.structureId, game);
    if (structure && structure.playerId == pId) {
      result = true;
    }
  })
  return result;
}
function VertexNeighbourHasStructure(vertex: Vertice, game: Game): boolean {
  const vertices = getVerticeAdjacentVertices(vertex, game);
  let found = false;
  vertices.forEach((v) => {
    if (v.structureId !== -1) found = true;
  })
  return found;
}
function VertexHasJoiningRoad(vertex: Vertice, player: Player, game: Game): boolean {
  let edges: Edge[] = getEdgesByList(vertex.edgeIds, game);
  let result = false;
  edges.forEach((e) => {
    const structure = getStructure(e.structureId, game)
    if (structure && structure.playerId == player.id) {
      result = true;
    }
  })
  return result;
}
function removeResource(resource: Resource, qty: number, player: Player) {
  const newResources = player.resources.filter(r => r !== resource);
  const resourceOfType = player.resources.filter(r => r == resource);
  while (qty) {
    resourceOfType.pop();
    qty--;
  }
  player.resources = [...newResources, ...resourceOfType];
}
export function rollDice(): [number, number] {
  const d1 = getRandomInt(1, 7);
  const d2 = getRandomInt(1, 7);
  return [d1, d2];
}
export function ValidSettlementPositions(game: Game, player: Player): number[] {
  const allVerts = [...game.vertices];
  const potential = allVerts.filter(v => !VertexNeighbourHasStructure(v, game) && v.structureId == -1);
  const structures = getAllStructuresByPlayer(player.id, game);
  const settlements = structures.filter(s => s.type == StructureType.Settlement).length;
  if (settlements < 2 || !settlements) {
    return potential.map(v => v.id);
  } else {
    return potential.filter(v => VertexHasJoiningRoad(v, player, game)).map(v => v.id);
  }
}
export function ValidCityPosition(game: Game, player: Player): number[] {
  const allVerts = game.vertices;
  const validPositions: number[] = [];
  allVerts.forEach((v) => {
    const structure = getStructure(v.structureId, game);
    if (structure?.playerId == player.id) {
      if (structure && structure.type == StructureType.Settlement) {
        validPositions.push(v.id);
      }
    }
  })
  return validPositions;
}
export function ValidRoadPosition(game: Game, player: Player): number[] {
  let allEdges = game.edges;
  const nearBuilding = allEdges.filter(e => isEdgeNearFriendlyStructure(e, game, player.id));
  const nearRoads = allEdges.filter(e => isEdgeNearFriendlyRoad(e, game, player.id));
  let result = [...nearBuilding, ...nearRoads];
  return result.map(e => e.id);
}
export function HandleDiceRoll(roll: number, g: Game): Game {
  const game = structuredClone(g);
  g.tiles.forEach((t) => {
    if (t.value == roll && !t.robber) {
      let vertices: Vertice[] = getVerticesByList(t.verticeIds, game);
      vertices.forEach((v) => {
        if (v.structureId !== -1) {
          const s = getStructure(v.structureId, game)!;
          const p = getPlayer(s.playerId, game);
          if (s.type == StructureType.Settlement) {
            p?.resources.push(t.resource);
          }
          else if (s.type == StructureType.City) {
            p?.resources.push(t.resource);
            p?.resources.push(t.resource);
          }
        }
      })
    }
  })
  return game;
}
export function AddResource(resource: Resource, pId: number, g: Game) {
  const game = structuredClone(g);
  const player = getPlayer(pId, game)!;
  player.resources.push(resource);
  return game;
}
export function canAfford(type: Purchase, resources: Resource[]): boolean {
  switch (type) {
    case Purchase.City: {
      const wheat = resources.filter(r => r == Resource.Wheat).length;
      const ore = resources.filter(r => r == Resource.Ore).length;

      if (wheat >= 2 && ore >= 3)
        return true;
      break;
    }
    case Purchase.Road: {
      const brick = resources.filter(r => r == Resource.Brick).length;
      const wood = resources.filter(r => r == Resource.Wood).length;

      if (brick >= 1 && wood >= 1)
        return true;
      break;
    }
    case Purchase.Settlement: {
      const brick = resources.filter(r => r == Resource.Brick).length;
      const wood = resources.filter(r => r == Resource.Wood).length;
      const wheat = resources.filter(r => r == Resource.Wheat).length;
      const sheep = resources.filter(r => r == Resource.Sheep).length;
      if (brick >= 1 && wood >= 1 && wheat >= 1 && sheep >= 1)
        return true;
      break;
    }
    case Purchase.DevCard: {
      const wheat = resources.filter(r => r == Resource.Wheat).length;
      const sheep = resources.filter(r => r == Resource.Sheep).length;
      const ore = resources.filter(r => r == Resource.Ore).length;

      if (wheat >= 1 && sheep >= 1 && ore >= 1)
        return true;
    }
  }
  return false;
}
export function makePurchase(type: Purchase, pId: number, g: Game): Game {
  const game = structuredClone(g);
  const player = game.players.find(pl => pl.id == pId)!;
  switch (type) {
    case Purchase.City: {
      removeResource(Resource.Wheat, 2, player);
      removeResource(Resource.Ore, 3, player);
      break;
    }
    case Purchase.Road: {
      removeResource(Resource.Brick, 1, player);
      removeResource(Resource.Wood, 1, player);
      break;
    }
    case Purchase.Settlement: {
      removeResource(Resource.Brick, 1, player);
      removeResource(Resource.Wood, 1, player);
      removeResource(Resource.Wheat, 1, player);
      removeResource(Resource.Sheep, 1, player);
      break;
    }
    case Purchase.DevCard: {
      removeResource(Resource.Wheat, 1, player);
      removeResource(Resource.Sheep, 1, player);
      removeResource(Resource.Ore, 1, player);
      break;
    }
  }
  return game;
}
export function getNewDevCard(pId: number, g: Game): Game {
  const game = structuredClone(g);
  const p = getPlayer(pId, game);
  const num = getRandomInt(0, game.devCards.length);
  const devCard: DevCard = game.devCards[num];
  game.devCards.splice(num, 1);
  p?.devCards.push(devCard);
  return game;
}
export function Buy(space: Vertice | Edge | undefined, purchase: Purchase, pId: number, g: Game): Game {
  let game = structuredClone(g);
  let player = getPlayer(pId, game)!;
  let building: Structure;
  let stype: StructureType = StructureType.None;
  game = makePurchase(purchase, player.id, game);

  if (purchase == Purchase.DevCard) {
    game = getNewDevCard(pId, game);
    return game;
  }
  switch (purchase) {
    case Purchase.City: stype = StructureType.City; break;
    case Purchase.Settlement: stype = StructureType.Settlement; break;
    case Purchase.Road: stype = StructureType.Road; break;
  }
  building = {
    id: game.structureIdCounter++,
    colour: player.colour,
    type: stype,
    playerId: player.id,
  }
  let position: Edge | Vertice;
  if (isEdge(space!)) {
    position = getEdge(space.id, game)!;
  } else {
    position = getVertice(space!.id, game)!;
  }
  player = getPlayer(pId, game)!;
  if (stype == StructureType.City) {
    const currentBuildingId = position.structureId;
    player.structureIds = player.structureIds.filter(id => id !== currentBuildingId);
    game.structures = game.structures.filter(s => s.id !== currentBuildingId);
  }
  position.structureId = building.id;
  game.structures.push(building);
  player.structureIds.push(building.id);
  return game;
}
function deselectEdges(g: Game) {
  g.edges.map(e => {
    e.highlighted = false;
    return e;
  })
}
function deselectVertices(g: Game) {
  g.vertices.map(e => {
    e.highlighted = false;
    return e;
  })
}
export function SelectStructures(g: Game, me: Player, selection: StructureType, currentSelected: StructureType): [Game, StructureType] {

  if (!g || !me) return [g, currentSelected];
  const game = structuredClone(g);
  let resultSelected: StructureType = StructureType.None;

  switch (selection) {
    case StructureType.Road: {
      if (currentSelected == StructureType.Road) {
        deselectEdges(game);
      } else {
        deselectVertices(game);
        const selectedIds = ValidRoadPosition(game, me);
        game.edges = game.edges.map(e => {
          if (selectedIds.some(s => s == e.id)) {
            e.highlighted = true;
          }
          return e;
        })
        resultSelected = StructureType.Road;
      }
      break;
    }
    case StructureType.Settlement: {
      if (currentSelected == StructureType.Settlement) {
        deselectVertices(game);
      } else {
        deselectEdges(game);
        const selectedIds = ValidSettlementPositions(game, me);
        game.vertices = game.vertices.map(e => {
          if (selectedIds.some(s => s == e.id)) {
            e.highlighted = true;
          }
          return e;
        })
        resultSelected = StructureType.Settlement;
      }
      break;
    }
    case StructureType.City: {
      if (currentSelected == StructureType.City) {
        deselectVertices(game);
      } else {
        deselectEdges(game);
        const selectedIds = ValidCityPosition(game, me);
        game.vertices = game.vertices.map(e => {
          if (selectedIds.some(s => s == e.id)) {
            e.highlighted = true;
          }
          return e;
        })
        resultSelected = StructureType.City;
      }
    }
  }

  return [game, resultSelected]
}
export function ReselectRoadsForRoadBuilding(pId: number, g: Game): Game {
  const game = structuredClone(g);
  const selectedIds = ValidRoadPosition(game, getPlayer(pId, game)!);
  game.edges = game.edges.map(e => {
    if (selectedIds.some(s => s == e.id)) {
      e.highlighted = true;
    }
    return e;
  })
  return game;
}
export function moveRobber(tId: number, pId: number, g: Game): Game {
  let game = structuredClone(g);
  const oldPos = game.tiles.find(t => t.robber);
  const newPos = game.tiles.find(t => t.id == tId);
  oldPos!.robber = false;
  newPos!.robber = true;
  const otherPlayersWithResources = game.players.filter(p => p.id !== pId && p.resources.length > 0);
  if (otherPlayersWithResources.length == 0) {
    game.gameState = GameState.Turn;
  } else {
    game.gameState = GameState.Stealing;
  }
  game = deselectTilesForRobber(game);
  return game;
}
export function selectTilesForRobber(g: Game): Game {
  const game = structuredClone(g);
  game.tiles.map((t) => {
    if (!t.robber) {
      t.highlighted = true;
    }
    return t;
  })
  return game;
}
export function deselectTilesForRobber(g: Game): Game {
  const game = structuredClone(g);
  game.tiles.map((t) => {
    t.highlighted = false;
    return t;
  })
  return game;
}
export function PlayDevCard(dId: number, pId: number, g: Game): Game {
  let game = structuredClone(g);
  let player = getPlayer(pId, game);
  const card = getDevCard(dId, player!)!;
  if (card?.type !== DevCardType.VP) {
    const gstate = devCardToGameState(card!.type)!;
    game.gameState = gstate;
    if (gstate == GameState.RobberPlacing) {
      game = selectTilesForRobber(game);
    }
  }
  card.played = true;
  return game;
}
export function Monopoly(resource: Resource, pId: number, g: Game): Game {
  let game = structuredClone(g);
  let player = getPlayer(pId, game)!;

  game.players.forEach((p) => {
    if (p.id == pId) return;
    const stolen = p.resources.filter(r => r == resource);
    p.resources = p.resources.filter(r => r == resource);
    stolen.forEach((s) => {
      player.resources.push(s);
    })
  })
  game.gameState = GameState.Turn;
  return game;
}
export function RoadBuildingFreeRoad(eId: number, pId: number, g: Game): Game {
  let game = structuredClone(g);
  const player = getPlayer(pId, game)!;
  const edge = getEdge(eId, game)!;
  const building = {
    id: game.structureIdCounter++,
    colour: player.colour,
    type: StructureType.Road,
    playerId: player.id,
  }
  player.structureIds.push(building.id);
  game.structures.push(building);
  edge.structureId = building.id;

  return game;
}
export function Rob(targetId: number, pId: number, g: Game): Game {
  let game = structuredClone(g);
  let player = getPlayer(pId, game)!;
  let target = getPlayer(targetId, game)!;
  let num = getRandomInt(0, target.resources.length);
  let stolen = target.resources[num];
  removeResource(stolen, 1, target);
  player.resources.push(stolen);
  game.gameState = GameState.Turn;
  return game;
}
export function EndEventGameState(g: Game): Game {
  const game = structuredClone(g);
  game.gameState = GameState.Turn;
  return game;
}
