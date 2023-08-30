import 'dotenv/config'
import mongoose from 'mongoose';
import { Card } from './card/card';
import CardModel from './model/Card.mongoose';

const uri = process.env.MONGODB || '';

export async function getCards(): Promise<Card[]> {
  let cards: Card[] = [];
  try {
    await mongoose.connect(uri);
    cards = await CardModel.find({});
  } catch (error) {
    console.error(error);
  } finally {
    mongoose.disconnect();
    return cards;
  }
}

export async function createCard(newCard: Card) {
  try {
    await mongoose.connect(uri);
    await CardModel.create(newCard);
  } catch (error) {
    console.error(error);
  } finally {
    mongoose.disconnect();
  }
}

export async function createCards(newCards: Card[]) {
  try {
    await mongoose.connect(uri);
    await CardModel.insertMany(newCards);
  } catch (error) {
    console.error(error);
  } finally {
    mongoose.disconnect();
  }
}

export async function updateCard(cardName: string) {
  try {
    await mongoose.connect(uri);
    const res = await CardModel.updateOne({ card_name: cardName }, { source: 'USS Enterprise' });
  } catch (error) {
    console.error(error);
  } finally {
    mongoose.disconnect();
  }
}