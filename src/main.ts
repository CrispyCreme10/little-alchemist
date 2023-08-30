import * as cheerio from 'cheerio'
import axios from 'axios';
import { downloadFile, readFromFile, writeToFile } from './file';
import { Card, CardCombos, CardForm, CardFusion, CardRarity, CardUpgradeStats } from './card/card';
import { setTimeout } from 'timers/promises';
import { createCard, createCards, getCards } from './mongodb';

const baseUrl = 'https://lil-alchemist.fandom.com'

async function getHTML(url: string) {
  const res = await axios.get(url);
  return res.data;
}

// function setCombos() {
//   getHTML(`${baseUrl}/wiki/Card_Combinations/All_Combinations`)
//     .then(res => {
//       const data = ['Primary,Primary Link,Secondary,Secondary Link,Result,Result Link,Result Rarity'];
//       const $ = cheerio.load(res);
//       $('.article-table > tbody > tr').each((i: number, tr: cheerio.Element) => {
//         const p = $(tr).find('td:nth-child(1) > a');
//         const primary = p.text().trim();
//         const pLink = p.attr('href');
//         const s = $(tr).find('td:nth-child(2) > a');
//         const secondary = s.text().trim();
//         const sLink = s.attr('href');
//         const r = $(tr).find('td:nth-child(3) > a');
//         const result = r.text().trim();
//         const rLink = r.attr('href');
//         const resultRarity = $(tr).find('td:nth-child(4) > a').text().trim();
//         data.push(`${primary},${pLink},${secondary},${sLink},${result},${rLink},${resultRarity}`);
//       });
    
//       writeToFile('comboData.json', data);
//     })
//     .catch(err => console.error(err));
// }

async function setCardLinksInOrder() {
  let links: string[] = [];
  const urls: string[] = [
    `${baseUrl}/wiki/Category:Bronze`,
    `${baseUrl}/wiki/Category:Silver`,
    `${baseUrl}/wiki/Category:Gold`,
    `${baseUrl}/wiki/Category:Diamond`,
    `${baseUrl}/wiki/Category:Onyx`
  ];

  let startingCharCode = 'A'.charCodeAt(0);
  const alphabetCount = 26;
  for(let i = 0; i < urls.length; i++) {
    const url = urls[i];
    if (i === 2 || i === 3) {
      for(let i = startingCharCode; i < startingCharCode + alphabetCount; i++) {
        const letter = String.fromCharCode(i);
        const sectionUrl = url + `?from=${letter}`;
        console.log(sectionUrl);
        const urlLinks = await getUrlLinks(sectionUrl);
    
        links = [...links, ...urlLinks];
        console.log('retrived: ', sectionUrl);
        console.log('total from category: ', urlLinks?.length);
        console.log('total links: ', links?.length);
        await setTimeout(3_000);
      }
    } else {
      const urlLinks = await getUrlLinks(url);
  
      links = [...links, ...urlLinks];
      console.log('retrived: ', url);
      console.log('total from category: ', urlLinks?.length);
      console.log('total links: ', links?.length);
      await setTimeout(3_000);
    }
  }

  console.log(links.length);
  writeToFile('links.json', links);
}

async function getUrlLinks(url: string): Promise<string[]> {
  console.log('retrieving: ', url);
  const res = await getHTML(url);
  const $ = cheerio.load(res);
  const urlLinks: string[] = [];
  $('.category-page__members-wrapper > ul > li > a').each((i: number, a: cheerio.Element) => {
    const val = $(a).attr('href')?.trim();
    if (val) {
      urlLinks.push(val);
    }
  })

  return urlLinks;
}

async function setCards(data: string[], startIndex: number, numToProcess: number) {
  console.log('starting index: ', startIndex);

  // transform to card obj
  const newCards: Card[] = [];
  const loopEnd = Math.min(startIndex + numToProcess, data?.length);
  for(let i = startIndex; i < loopEnd; i++) {
    const cardLink = data[i];
    const newCard = await createCardObj(cardLink);
    if (newCard === undefined) {
      console.log('ended early at: ', i);
      break;
    }

    if (newCard?.imgUrl) {
      const filepath = await downloadFile(newCard.imgUrl, `${newCard?.card_name}.png`);
      newCard.imgFileName = filepath;
    }

    newCard.card_id = i + 1;
    newCards.push(newCard);
    await createCard(newCard);
    console.log(`[${new Date(Date.now()).toISOString()}] completed: (${cardLink}) (${i + 1 - startIndex}/${loopEnd - startIndex})`);
    if (i <= loopEnd - 1) {
      await setTimeout(3_000);
    }
  }

  // batch save to db
  // await createCards(newCards);
}

function createCardObj(link: string): Promise<Card | undefined> {
  return getHTML(`${baseUrl}${link}`)
    .then(res => mapCheerioToCard(res, link))
    .catch(err => {
      console.error(err)
      return undefined;
    });
}

function mapCheerioToCard(htmlRes: string, link: string): Card {
  const $ = cheerio.load(htmlRes);

  const upgradeStats: CardUpgradeStats[] = [];
  $('.article-table:first-of-type > tbody > tr:not(:first-of-type)')
    .each((i: number, tr: cheerio.Element) => {
      const obj = {
        level: i + 1,
        attack: Number($(tr).find('td:first-of-type').text().trim()),
        defense: Number($(tr).find('td:last-of-type').text().trim())
      };
      upgradeStats.push(obj);
    })

  const form = $('td[data-source="form"]:nth-child(2)').text().trim() as CardForm;
  const cardCombos: CardCombos[] = [];
  $('.article-table:last-of-type > tbody > tr')
    .each((i: number, tr: cheerio.Element) => {
      const obj = {
        card: $(tr).find('td:first-of-type > *').text().trim(),
        resultCard: $(tr).find('td:nth-of-type(2) > a').text().trim(),
        researchTime: form === CardForm.Combo 
          ? $(tr).find('td:last-of-type').text().trim()
          : ''
      };

      if (obj?.card && obj?.resultCard) {
        cardCombos.push(obj);
      }
    })

  const attack = Number($('td[data-source="attack"]').text().trim());
  const defense = Number($('td[data-source="defense"]').text().trim());

  return {
    card_id: -1,
    card_name: $('.mw-page-title-main').text().trim(),
    attack: attack,
    defense: defense,
    power: attack + defense,
    rarity: $('td[data-source="rarity"] a').text().trim() as CardRarity,
    form: form,
    fusion: $('div[data-source="fusion"] > div > b').text().trim() as CardFusion,
    upgradeStats: upgradeStats,
    cardCombos: cardCombos,
    imgUrl: $('figure[data-source="image"] > a').attr('href')?.trim(),
    imgFileName: '',
    source: link
  }
}

async function fillDatabase() {
  // get links
  const data = await getLinks();

  // get existing cards
  const cards = await getCards();
  let startIndex = cards?.length || 0;
  const batchSize = 100;
  while (startIndex < data?.length) {
    await setCards(data, startIndex, batchSize);
    await setTimeout(30_000); // 30s break between batches
    const cards = await getCards();
    startIndex = cards?.length || 0;
  }
}

async function getLinks(): Promise<string[]> {
  return await readFromFile<string[]>('links.json');
}

async function addSourceToExistingDocuments() {
  // get links
  const data: string[] = await getLinks();

  // get cards in db
  const cards: Card[] = await getCards();

  console.log(cards[0]?.source);

  const numToProcess = 1;
  for (let index = 0; index < numToProcess; index++) {
    const link = data[index];
    const card = await createCardObj(link);
    const dbCard = cards.find(c => c.card_name === card?.card_name);
    if (card && dbCard) {
      console.log(`[${new Date(Date.now()).toISOString()}] updating source for: ${card.card_name}`);
      
    }

    await setTimeout(3_000);
  }
}

addSourceToExistingDocuments();