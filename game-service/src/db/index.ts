//// filepath: /home/saitcho/webmud/game-service/src/db/index.ts
import { Db } from "mongodb";
import { UserRepository } from "./userRepository.js";
import { ChannelRepository } from "./channelRepository.js";
import { MessageRepository } from "./messageRepository.js";
import { WorldRepository } from "./worldRepository.js";

export interface Repositories {
  userRepository: UserRepository;
  channelRepository: ChannelRepository;
  messageRepository: MessageRepository;
  worldRepository: WorldRepository;
}

export function createRepositories(db: Db): Repositories {
  return {
    userRepository: new UserRepository(db),
    channelRepository: new ChannelRepository(db),
    messageRepository: new MessageRepository(db),
    worldRepository: new WorldRepository(db)
  };
}