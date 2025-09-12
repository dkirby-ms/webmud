//// filepath: /home/saitcho/webmud/game-service/src/db/index.ts
import { Db } from "mongodb";
import { UserRepository } from "./userRepository.js";
import { ChannelRepository } from "./channelRepository.js";
import { MessageRepository } from "./messageRepository.js";
import { WorldRepository } from "./worldRepository.js";
import { RoomRepository } from "./roomRepository.js";
import { EntityRepository } from "./entityRepository.js";
import { PlayerCharacterRepository } from "./playerCharacterRepository.js";
import { CharacterSpeciesRepository } from "./characterSpeciesRepository.js";
import { CharacterSkillsRepository } from "./characterSkillsRepository.js";
import { CardRepository } from "./cardRepository.js";
import { DeckRepository } from "./deckRepository.js";
import { CardCollectionRepository } from "./cardCollectionRepository.js";

export interface Repositories {
  userRepository: UserRepository;
  channelRepository: ChannelRepository;
  messageRepository: MessageRepository;
  worldRepository: WorldRepository;
  roomRepository: RoomRepository;
  entityRepository: EntityRepository;
  playerCharacterRepository: PlayerCharacterRepository;
  characterSpeciesRepository: CharacterSpeciesRepository;
  characterSkillsRepository: CharacterSkillsRepository;
  cardRepository: CardRepository;
  deckRepository: DeckRepository;
  cardCollectionRepository: CardCollectionRepository;
}

export function createRepositories(db: Db): Repositories {
  return {
    userRepository: new UserRepository(db),
    channelRepository: new ChannelRepository(db),
    messageRepository: new MessageRepository(db),
    worldRepository: new WorldRepository(db),
    roomRepository: new RoomRepository(db),
    entityRepository: new EntityRepository(db),
    playerCharacterRepository: new PlayerCharacterRepository(db),
    characterSpeciesRepository: new CharacterSpeciesRepository(db),
    characterSkillsRepository: new CharacterSkillsRepository(db),
    cardRepository: new CardRepository(db),
    deckRepository: new DeckRepository(db),
    cardCollectionRepository: new CardCollectionRepository(db),
  };
}