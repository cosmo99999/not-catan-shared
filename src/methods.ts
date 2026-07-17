import { Edge, Game, getRandomInt, Player, Purchase, Resource, Structure, StructureType, Vertice } from "./model";

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
export function getAllStructuresByPlayer(id: number, game: Game) {
  return game.structures.filter((s: Structure) => (s.playerId == id))
}
function contains(array: number[], value: number) {
  if (array.find(v => v == value)) return true;
  return false;
}
function isEdgeNearStructure(edge: Edge, game: Game): boolean {
  let vertices = game.vertices.filter((v: Vertice) => contains(v.edgeIds, edge.id));
  vertices.forEach((v) => {
    if (v.structureId !== -1) {
      return true;
    }
  })
  return false;
}
function isEdgeNearFriendlyStructure(edge: Edge, game: Game, pId: number): boolean {
  let vertices = game.vertices.filter((v: Vertice) => contains(v.edgeIds, edge.id));
  vertices.forEach((v) => {
    const structure = getStructure(v.structureId, game);
    if (structure && structure.playerId == pId) {
      return true;
    }
  })
  return false;
}
function VertexNeighbourHasStructure(vertex: Vertice, game: Game): boolean {
  let edges: Edge[] = [];
  vertex.edgeIds.forEach((id) => {
    edges.push(getEdge(id, game)!)
  })
  edges.forEach((e) => {
    let vertices: Vertice[] = [];
    e.verticeIds.forEach((id) => {
      vertices.push(getVertice(id, game)!)
    })
    vertices.forEach((v) => {
      if (v.structureId !== -1 && v.id !== vertex.id) {
        return true;
      }
    })
  })
  return false;
}
function VertexHasJoiningRoad(vertex: Vertice, player: Player, game: Game): boolean {
  let edges: Edge[] = [];

  vertex.edgeIds.forEach((id) => {
    edges.push(getEdge(id, game)!)
  })
  edges.forEach((e) => {
    if (e.structure) {
      const structure = getStructure(e.structure.id, game)
      if (structure?.playerId == player.id) {
        return true;
      }
    }
  })
  return false;
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
  const potential = allVerts.filter(v => !VertexNeighbourHasStructure(v, game));
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
  allEdges = allEdges.filter(e => isEdgeNearFriendlyStructure(e, game, player.id));
  return allEdges.map(e => e.id);
}
export function HandleDiceRoll(roll: number, g: Game): Game {
  const game = structuredClone(g);
  g.tiles.forEach((t) => {
    if (t.value == roll && !t.robber) {
      let vertices: Vertice[] = [];
      t.verticeIds.forEach((id) => vertices.push(getVertice(id, game)!));
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
export function BuildCity(vertex: Vertice, pId: number, g: Game): Game {
  const game = structuredClone(g);
  const player = getPlayer(pId, game)!;
  const c: Structure = {
    id: game.structureIdCounter++,
    colour: player.colour,
    type: StructureType.City,
    playerId: player.id,
  }

  const currentStructureId = vertex.structureId;
  game.structures = game.structures.filter(s => s.id != currentStructureId);
  player.structureIds = player.structureIds.filter(s => s != currentStructureId);

  const modifiedVert = game.vertices.find((v) => v.id == vertex.id);
  modifiedVert!.structureId = c.id;
  game.structures.push(c);
  player.structureIds.push(c.id);
  return game;
}
export function BuildSettlement(vertex: Vertice, pId: number, g: Game): Game {
  const game = structuredClone(g);
  const player = getPlayer(pId, game)!;

  const s: Structure = {
    id: game.structureIdCounter++,
    colour: player.colour,
    type: StructureType.Settlement,
    playerId: player.id,
  }

  const modifiedVert = game.vertices.find((v) => v.id == vertex.id);
  modifiedVert!.structureId = s.id;
  game.structures.push(s);
  player.structureIds.push(s.id);
  return game;
}
export function BuildRoad(edge: Edge, pId: number, g: Game): Game {
  const game = structuredClone(g);
  const player = getPlayer(pId, game)!;

  const r: Structure = {
    id: game.structureIdCounter++,
    colour: player.colour,
    type: StructureType.Settlement,
    playerId: player.id,
  }

  const modifiedEdge = game.edges.find((v) => v.id == edge.id);
  modifiedEdge!.structure = r;
  game.structures.push(r);
  player.structureIds.push(r.id);
  return game;
}
export function SelectStructures(g: Game, me: Player, selectedStructure: StructureType, currentSelected: StructureType): [Game, StructureType] {
  if (!g || !me) return [g, currentSelected];
  const game = structuredClone(g);
  let resultSelected: StructureType = StructureType.None;
  switch (selectedStructure) {
    case StructureType.Road: {
      if (currentSelected == StructureType.Road) {
        game.edges = game.edges.map(e => {
          e.highlighted = false;
          return e;
        })
      } else {
        const selectedIds = ValidRoadPosition(game, me);
        game.edges = game.edges.map(e => {
          if (selectedIds.find(s => s == e.id)) {
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
        game.vertices = game.vertices.map(e => {
          e.highlighted = false
          return e;
        });
      } else {
        const selectedIds = ValidSettlementPositions(game, me);
        game.vertices = game.vertices.map(e => {
          if (selectedIds.find(s => s == e.id)) {
            e.highlighted = true;
          }
          return e;
        })
        resultSelected = StructureType.Settlement;
      }
      break;
    }
    case StructureType.City: {
      let newVertices: Vertice[] = [];
      if (currentSelected == StructureType.City) {
        newVertices = game.vertices.map(e => {
          e.highlighted = false
          return e;
        });
      } else {
        const selectedIds = ValidCityPosition(game, me);
        newVertices = game.vertices.map(e => {
          if (selectedIds.find(s => s == e.id)) {
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
