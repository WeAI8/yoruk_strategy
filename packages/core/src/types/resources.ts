/**
 * Bozkır Stratejisi Temel Kaynak Tanımları
 */
export interface ResourceInventory {
  horse: number;    // Tulpar Soyu At (Süvari, göç, keşif)
  food: number;     // Tahıl & Et (Oba iaşesi)
  iron: number;     // Demir (Silah, zırh, üzengi)
  leather: number;  // Keçe & Deri (Otağ, yay, kalkan)
  gold: number;     // Altın (Kurultay, ticaret, diplomasi)
}

export type ResourceType = keyof ResourceInventory;

export const INITIAL_RESOURCES: ResourceInventory = {
  horse: 50,
  food: 200,
  iron: 40,
  leather: 80,
  gold: 100,
};
