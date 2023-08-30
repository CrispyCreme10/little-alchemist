import fs from 'fs';
import fsProm from 'fs/promises';
import client from 'https';

const FILE_PATH = 'data/'

export const writeToFile = (filename: string, data: any) => {
  const filepath = FILE_PATH + filename;
  fsProm.writeFile(filepath, JSON.stringify(data))
    .then(_ => console.log('file successfully saved!'))
    .catch(err => console.error(err));
}

export const readFromFile = async <T>(filename: string): Promise<T> => {
  const filepath = FILE_PATH + filename;
  return fsProm.readFile(filepath)
    .then(data => JSON.parse(data.toString()))
    .catch(err => console.error(err));
}

export const downloadFile = async(url: string, filename: string): Promise<string> => {
  const filepath = FILE_PATH + 'card_imgs/' + filename;
  if (fs.existsSync(filepath)) {
    console.log('file already downloaded: ', filename);
    return Promise.resolve(filepath);
  }
  return new Promise((resolve, reject) => {
    client.get(url, res => {
      if (res.statusCode === 200) {
        res.pipe(fs.createWriteStream(filepath))
          .on('error', reject)
          .once('close', () => resolve(filepath))
      } else {
        res.resume();
        reject(new Error(`Request failed with status code: ${res.statusCode}`));
      }
    })
  })
}