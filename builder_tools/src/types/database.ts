import { ObjectId } from 'mongodb';

export interface World {
  _id: ObjectId;
  name: string;
  description: string;
  created: Date;
  updated: Date;
}

export interface Room {
  _id: ObjectId;
  worldId: string;
  world_id: string; // For backwards compatibility
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
  coordinates?: {
    x: number;
    y: number;
    z: number;
  };
  properties: {
    [key: string]: any;
  }
}
