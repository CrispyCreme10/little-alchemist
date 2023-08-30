export interface CardUpgradeStats {
  level: number,
  attack: number,
  defense: number
}

export interface CardCombos {
  card: string;
  resultCard: string;
  researchTime: string;
}

export class Card {
  card_id!: number;
  card_name!: string;
  attack!: number;
  defense!: number;
  power!: number;
  rarity!: CardRarity;
  form!: CardForm;
  fusion!: CardFusion;
  upgradeStats!: CardUpgradeStats[];
  cardCombos!: CardCombos[];
  imgUrl!: string | undefined;
  imgFileName!: string;
  source!: string;
}

export enum CardRarity {
  Bronze = 'Bronze',
  Silver = 'Silver',
  Gold = 'Gold',
  Diamond = 'Diamond',
  Onyx = 'Onyx'
}

export enum CardForm {
  Combo = 'Combo',
  Final = 'Final'
}

export enum CardFusion {
  Orb = 'Orb',
  Pierce = 'Pierce',
  CrushingBlow = 'Crushing Blow',
  Block = 'Block',
  Protection = 'Protection',
  Reflect = 'Reflect',
  CounterAttack = 'Counter Attack',
  Siphon = 'Siphon',
  Absorb = 'Absorb',
  Amplify = 'Amplify',
  CriticalStrike = 'Critical Strike',
  Weaken = 'Weaken',
  Curse = 'Curse'
}