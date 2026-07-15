import { Edge, Game, getRandomInt, Player, Purchase, Resource, Structure, StructureType, Vertice } from "./model";

function EdgeAdjacentToStructure(edge: Edge, player: Player): boolean {
  edge.vertices.forEach((v) => {
    if (v.structure && v.structure.player == player) {
      return true;
    }
  })
  return false;
}
function VertexNeighbourHasStructure(vertex: Vertice): boolean {
  vertex.edges.forEach((e) => {
    e.vertices.forEach((v) => {
      if (v.structure && v.id !== vertex.id) {
        return true;
      }
    })
  })
  return false;
}
function VertexHasJoiningRoad(vertex: Vertice, player: Player): boolean {
  vertex.edges.forEach((e) => {
    if (e.structure) {
      if (e.structure.player == player) {
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
  const potential = allVerts.filter(v => !VertexNeighbourHasStructure(v));
  const settlements = player.structures?.filter(s => s.type == StructureType.Settlement).length;
  if (settlements < 2 || !settlements) {
    return potential.map(v => v.id);
  } else {
    return potential.filter(v => VertexHasJoiningRoad(v, player)).map(v => v.id);
  }
}
export function ValidCityPosition(game: Game, player: Player): number[] {
  const allVerts = [...game.vertices];
  return allVerts.filter(
    v => (!VertexNeighbourHasStructure(v) && v.structure?.type == StructureType.Settlement && v.structure.player == player))
    .map(vx => vx.id);
}
export function ValidRoadPosition(game: Game, player: Player): number[] {
  const allEdges = [...game.edges];
  return allEdges.filter(e => EdgeAdjacentToStructure(e, player)).map(e => e.id);
}
export function HandleDiceRoll(roll: number, game: Game): Game {
  const g = structuredClone(game);
  g.tiles.forEach((t) => {
    if (t.value == roll && !t.robber) {
      t.vertices.forEach((v) => {
        if (v.structure) {
          if (v.structure.type == StructureType.Settlement) {
            v.structure.player.resources.push(t.resource);
          }
          else if (v.structure.type == StructureType.City) {
            v.structure.player.resources.push(t.resource);
            v.structure.player.resources.push(t.resource);
          }
        }
      })
    }
  })
  return g;
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
export function makePurchase(type: Purchase, p: Player): Player {
  const player = structuredClone(p);
  switch (type) {
    case Purchase.City: {
      removeResource(Resource.Wheat, 2, player);
      removeResource(Resource.Ore, 3, player);
    }
    case Purchase.Road: {
      removeResource(Resource.Brick, 1, player);
      removeResource(Resource.Wood, 1, player);
    }
    case Purchase.Settlement: {
      removeResource(Resource.Brick, 1, player);
      removeResource(Resource.Wood, 1, player);
      removeResource(Resource.Wheat, 1, player);
      removeResource(Resource.Sheep, 1, player);
    }
    case Purchase.DevCard: {
      removeResource(Resource.Wheat, 1, player);
      removeResource(Resource.Sheep, 1, player);
      removeResource(Resource.Ore, 1, player);
    }
  }
  return player;

}
export function BuildCity(vertex: Vertice, p: Player, g: Game): [Game, Player] {
  const game = structuredClone(g);
  const player = structuredClone(p);
  const c = new Structure(
    player.colour,
    StructureType.Settlement,
    player);

  const currentStructureId = vertex.structure!.id;
  game.structures = game.structures.filter(s => s.id == currentStructureId);
  player.structures = player.structures.filter(s => s.id == currentStructureId);

  vertex.structure = c;
  game.structures.push(c);
  player.structures.push(c);
  return [game, player];
}
export function BuildSettlement(vertex: Vertice, p: Player, g: Game): [Game, Player] {
  const player = structuredClone(p);
  const game = structuredClone(g);
  const s = new Structure(
    player.colour,
    StructureType.Settlement,
    player);

  vertex.structure = s;
  game.structures.push(s);
  player.structures.push(s);
  return [game, player];
}
export function BuildRoad(edge: Edge, p: Player, g: Game): [Game, Player] {
  const player = structuredClone(p);
  const game = structuredClone(g);
  const r = new Structure(
    player.colour,
    StructureType.Road,
    player);

  edge.structure = r;
  game.structures.push(r);
  player.structures.push(r);
  return [game, player];
}
