import type { SaveDeckDTO, SaveDeckResultDTO } from "../../shared/models/index.js";

/**
 * Contract for the service that orchestrates deck building and persistence.
 */
export interface IAnkiDeckService {
  save(dto: SaveDeckDTO): Promise<SaveDeckResultDTO>;
}
