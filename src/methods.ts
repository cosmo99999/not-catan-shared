import { DevCard, DevCardType, Edge, Game, FourPlayerPreGameOrder, GameState, getRandomInt, isEdge, Location, Player, Purchase, Resource, Structure, StructureType, Tile, Trade, Vertice } from "./model";
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
export function getTilesByList(ids: number[], game: Game) {
  const tiles = game.tiles.filter(v => ids.some(i => i == v.id));
  return tiles;
}

export function getPlayersToRob(game: Game, pId: number) {
  const robberTile: Tile = game.tiles.find(t => t.robber == true)!;
  const vertices = getVerticesByList(robberTile.verticeIds, game);
  let players: number[] = [];
  vertices.map((v) => {
    const structure = getStructure(v.structureId, game);
    if (structure && structure.playerId !== pId) {
      let player = getPlayer(structure.playerId, game)!;
      if (player?.resources.length > 0) {
        players.push(structure.playerId!);
      }
    }
  });

  if (players.length == 0) return;
  return [...new Set(players.map(p => getPlayer(p!, game)))];
}
function AddResource(resource: Resource, pId: number, game: Game) {
  if (resource == Resource.None || resource == undefined) return;
  const player = getPlayer(pId, game)!;
  player.resources.push(resource);
}
function RemoveResource(resource: Resource, pId: number, game: Game) {
  const player = getPlayer(pId, game)!;
  const index = player.resources.findIndex(r => r == resource);
  player.resources.splice(index, 1);
}
export function CanAfford(type: Purchase, resources: Resource[]): boolean {
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

export function HandleDiceRoll(roll: number, g: Game): Game {
  const game = structuredClone(g);
  if (roll == 7) {
    const playersWithSevenCards = game.players.filter(p => p.resources.length >= 8);
    // if (playersWithSevenCards.length > 0) {
    //   game.gameState = GameState.Discard;
    // } else {
    //   game.gameState = GameState.RobberPlacing;
    // }
    game.gameState = GameState.RobberPlacing;
    return game;
  }
  g.tiles.forEach((t) => {
    if (t.value == roll && !t.robber) {
      let vertices: Vertice[] = getVerticesByList(t.verticeIds, game);
      vertices.forEach((v) => {
        if (v.structureId !== -1) {
          const s = getStructure(v.structureId, game)!;
          const p = getPlayer(s.playerId, game)!;
          if (s.type == StructureType.Settlement) {
            AddResource(t.resource, p.id, game)
          }
          else if (s.type == StructureType.City) {
            AddResource(t.resource, p.id, game)
            AddResource(t.resource, p.id, game)
          }
        }
      })
    }
  })
  game.gameState = GameState.Turn;
  return game;
}
export function MakePurchase(type: Purchase, pId: number, g: Game): Game {
  const game = structuredClone(g);
  switch (type) {
    case Purchase.City: {
      RemoveResource(Resource.Wheat, pId, game);
      RemoveResource(Resource.Wheat, pId, game);
      RemoveResource(Resource.Ore, pId, game);
      RemoveResource(Resource.Ore, pId, game);
      RemoveResource(Resource.Ore, pId, game);
      break;
    }
    case Purchase.Road: {
      RemoveResource(Resource.Wood, pId, game);
      RemoveResource(Resource.Brick, pId, game);
      break;
    }
    case Purchase.Settlement: {
      RemoveResource(Resource.Wood, pId, game);
      RemoveResource(Resource.Brick, pId, game);
      RemoveResource(Resource.Sheep, pId, game);
      RemoveResource(Resource.Wheat, pId, game);
      break;
    }
    case Purchase.DevCard: {
      RemoveResource(Resource.Sheep, pId, game);
      RemoveResource(Resource.Wheat, pId, game);
      RemoveResource(Resource.Ore, pId, game);
      break;
    }
  }
  return game;
}
export function GetDevCard(pId: number, g: Game): Game {
  const game = structuredClone(g);
  const p = getPlayer(pId, game);
  const num = getRandomInt(0, game.devCards.length);
  const devCard: DevCard = game.devCards[num];
  devCard.purchasedThisTurn = true;
  game.devCards.splice(num, 1);
  p?.devCards.push(devCard);
  return game;
}
export function Buy(space: Vertice | Edge | undefined, purchase: Purchase, pId: number, g: Game): Game {
  let game = structuredClone(g);
  let player = getPlayer(pId, game)!;
  let building: Structure;
  let stype: StructureType = StructureType.None;
  game = MakePurchase(purchase, player.id, game);

  if (purchase == Purchase.DevCard) {
    game = GetDevCard(pId, game);
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
export function EndTurn(pId: number, g: Game) {
  const game = structuredClone(g);
  const player = getPlayer(pId, game)!;
  for (let i = 0; i < player.devCards.length; i++) {
    player.devCards[i].purchasedThisTurn = false;
  }
  if (game.gameState !== GameState.Start) {
    const nextPlayerId = (pId + 1) % game.players.length;
    game.gameState = GameState.PreRoll;
    game.currentTurnPlayerId = nextPlayerId;
  } else {
    //end of setup phase
    if (FourPlayerPreGameOrder.length == game.gameStartOrderIndex) {
      game.currentTurnPlayerId = 0;
      game.gameState = GameState.PreRoll;
      game.players.forEach((p) => {
        const tiles = getTilesByList(p.secondPlacedSettlement!.tileIds, game)!;
        tiles.forEach((t) => {
          AddResource(t.resource, p.id, game);
        })
      })
    } else {
      const nextPlayerId = FourPlayerPreGameOrder[game.gameStartOrderIndex];
      game.currentTurnPlayerId = nextPlayerId;
      game.gameStartOrderIndex++;
    }
  }
  return game;
}

export function CreateTrade(trade: Trade, g: Game) {
  const game = structuredClone(g);
  game.liveTradeOffer = trade;
  return game;
}
export function AcceptTrade(pId: number, g: Game): Game {
  let game = structuredClone(g);
  const trade = game.liveTradeOffer!;
  const tradeOfferPlayerId = trade.playerId;
  const tradeAccepterPlayerId = pId;

  trade.recieving.forEach((r) => {
    RemoveResource(r, tradeAccepterPlayerId, game);
    AddResource(r, tradeOfferPlayerId, game);
  })

  trade.giving.forEach((r) => {
    RemoveResource(r, tradeOfferPlayerId, game);
    AddResource(r, tradeAccepterPlayerId, game);
  })
  return game;
}
export function CancelTrade(g: Game) {
  const game = structuredClone(g);
  game.liveTradeOffer = undefined;
  return game;
}
export function MakeBankTrade(trade: Trade, g: Game) {
  let game = structuredClone(g);
  trade.giving.forEach((g) => {
    RemoveResource(g, trade.playerId, game);
  })
  trade.recieving.forEach((r) => {
    AddResource(r, trade.playerId, game)
  })
  return game;
}
export function MoveRobber(tId: number, pId: number, g: Game): Game {
  let game = structuredClone(g);
  const oldPos = game.tiles.find(t => t.robber);
  const newPos = game.tiles.find(t => t.id == tId);
  oldPos!.robber = false;
  newPos!.robber = true;
  const players = getPlayersToRob(game, pId);
  if (!players || players.length == 0) {
    if (game.preRollRobberPlayed) {
      game.preRollRobberPlayed = false;
      game.gameState = GameState.PreRoll;
    } else {
      game.gameState = GameState.Turn;
    }
  } else {
    game.gameState = GameState.Stealing;
  }
  return game;
}
export function Discard(resources: Resource[], pId: number, g: Game) {
  const game = structuredClone(g);
  resources.forEach((r) => {
    RemoveResource(r, pId, game);
  })
  return game;
}

//dev card event handling
export function PlayDevCard(dId: number, pId: number, g: Game): Game {
  let game = structuredClone(g);
  let player = getPlayer(pId, game)!;
  player.playedDevThisTurn = true;
  const card = getDevCard(dId, player!)!;
  if (game.gameState == GameState.PreRoll) {
    game.preRollRobberPlayed = true;
  }
  if (card?.type !== DevCardType.VP) {
    const gstate = devCardToGameState(card!.type)!;
    game.gameState = gstate;
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
export function Rob(targetId: number, pId: number, g: Game): Game {
  let game = structuredClone(g);
  let player = getPlayer(pId, game)!;
  let target = getPlayer(targetId, game)!;
  let num = getRandomInt(0, target.resources.length);
  let stolen = target.resources[num];
  RemoveResource(stolen, targetId, game);
  player.resources.push(stolen);
  if (game.preRollRobberPlayed) {
    game.preRollRobberPlayed = false;
    game.gameState = GameState.PreRoll;
  }
  game.gameState = GameState.Turn;
  return game;
}
export function RoadBuilding(eId: number, pId: number, g: Game): Game {
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
export function StartingSettlement(vId: number, pId: number, g: Game): Game {
  let game = structuredClone(g);
  const player = getPlayer(pId, game)!;
  const vertex = getVertice(vId, game)!;
  if (player.structureIds.length == 2) {
    player.secondPlacedSettlement = vertex;
  }
  const building = {
    id: game.structureIdCounter++,
    colour: player.colour,
    type: StructureType.Settlement,
    playerId: player.id,
  }
  player.structureIds.push(building.id);
  game.structures.push(building);
  vertex.structureId = building.id;

  return game;
}

export function YearOfPlenty(pId: number, resource: Resource, g: Game): Game {
  const game = structuredClone(g);
  AddResource(resource, pId, game);
  return game;
}
export function EndEventGameState(g: Game): Game {
  const game = structuredClone(g);
  game.gameState = GameState.Turn;
  return game;
}
