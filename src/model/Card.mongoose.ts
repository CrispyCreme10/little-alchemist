import mongoose from 'mongoose';
const { Schema, model } = mongoose;

export const cardSchema = new Schema({
  card_id: Number,
  card_name: String,
  attack: Number,
  defense: Number,
  power: Number,
  rarity: String,
  form: String,
  fusion: String,
  upgradeStats: [{
    level: Number,
    attack: Number,
    defense: Number
  }],
  cardCombos: [{
    card: String,
    resultCard: String,
    researchTime: String
  }],
  imgUrl: String,
  imgFileName: String,
  source: String,
});

const CardModel = model('Card', cardSchema);
export default CardModel;