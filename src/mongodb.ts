import 'dotenv/config'
import mongoose from 'mongoose';
import { Card } from './card/card';
import CardModel from './model/Card.mongoose';

const uri = process.env.MONGODB || '';

export async function mongoConnect() {
  await mongoose.connect(uri);
}

export async function mongoDisconnect() {
  await mongoose.disconnect();
}

export async function getCards(): Promise<Card[]> {
  let cards: Card[] = [];
  try {
    cards = await CardModel.find({});
  } catch (error) {
    console.error(error);
  } finally {
    return cards;
  }
}

export async function createCard(newCard: Card) {
  try {
    await CardModel.create(newCard);
  } catch (error) {
    console.error(error);
  }
}

export async function createCards(newCards: Card[]) {
  try {
    await CardModel.insertMany(newCards);
  } catch (error) {
    console.error(error);
  }
}

export async function updateCard(cardName: string, updateProps: object) {
  try {
    const res = await CardModel.updateOne({ card_name: cardName }, updateProps);
    // console.log(res);
  } catch (error) {
    console.error(error);
  }
}