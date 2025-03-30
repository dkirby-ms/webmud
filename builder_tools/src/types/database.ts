export interface World {
  _id: string;
  name: string;
  description: string;
  created: Date;
  updated: Date;
}

export interface Room {
  _id: string;
  worldId: string;
  name: string;
  description: string;
  exits: {
    north?: string;
    south?: string;
    east?: string;
    west?: string;
    up?: string;
    down?: string;
  };
  coordinates: {
    x: number;
    y: number;
    z: number;
  };
}
