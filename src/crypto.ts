import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';

const WORDS = [
  'ace','add','age','ago','aid','aim','air','all','and','ant',
  'any','ape','arc','are','ark','arm','art','ash','ask','ate',
  'awe','axe','bad','bag','ban','bar','bat','bay','bed','bee',
  'bet','big','bit','bow','box','boy','bud','bug','bus','but',
  'buy','cab','cam','can','cap','car','cat','cop','cow','cry',
  'cub','cup','cur','cut','dad','dam','day','den','dew','did',
  'dig','dim','dip','dog','dot','dry','dub','dud','due','dug',
  'dun','duo','dye','ear','eat','eel','egg','ego','elm','emu',
  'end','era','eve','ewe','eye','fan','far','fat','fax','fed',
  'fee','few','fig','fin','fir','fit','fix','fly','foe','fog',
  'for','fox','fry','fun','fur','gag','gap','gas','gel','gem',
  'get','gin','gnu','god','got','gum','gun','gut','guy','gym',
  'had','ham','has','hat','hay','hen','her','hew','hex','hid',
  'him','hip','his','hit','hog','hop','hot','how','hub','hue',
  'hug','hum','hut','ice','icy','ill','imp','ink','inn','ion',
  'ire','irk','ivy','jab','jag','jam','jar','jaw','jay','jet',
  'jig','job','jog','jot','joy','jug','jut','keg','ken','key',
  'kid','kin','kit','lab','lad','lag','lap','law','lay','lea',
  'led','leg','let','lid','lie','lip','lit','log','lot','low',
  'lug','mad','man','map','mat','maw','max','may','men','met',
  'mid','mix','mob','mod','mom','mop','mow','mud','mug','nab',
  'nag','nap','net','new','nil','nit','nod','nor','not','now',
  'nun','nut','oak','oar','oat','odd','ode','off','oft','ohm',
  'oil','old','one','opt','orb','ore','our','out','owe','owl',
  'own','pad','pan','paw','pay','pea','peg','pen','per','pet',
  'pie','pig','pin','pit','ply','pod',
];

/**
 * Generate a transfer code that encodes both the encryption key and gist ID.
 * Format: word1-word2-word3-{keyHex}{gistId}
 */
export function generateTransferCode(gistId: string, existingKey?: Buffer): { code: string; key: Buffer } {
  const key = existingKey ?? randomBytes(32);

  const w1 = WORDS[key[0] % WORDS.length];
  const w2 = WORDS[key[1] % WORDS.length];
  const w3 = WORDS[key[2] % WORDS.length];

  const keyHex = key.toString('hex');
  const code = `${w1}-${w2}-${w3}-${keyHex}${gistId}`;

  return { code, key };
}

/**
 * Parse a transfer code back into key + gistId.
 */
export function parseTransferCode(code: string): { key: Buffer; gistId: string } {
  const parts = code.split('-');
  if (parts.length < 4) {
    throw new Error('Invalid transfer code format');
  }

  const tail = parts.slice(3).join('-');
  const keyHex = tail.slice(0, 64);
  const gistId = tail.slice(64);

  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== 32) {
    throw new Error('Invalid transfer code: bad key');
  }

  return { key, gistId };
}

/**
 * Encrypt data with AES-256-GCM.
 * Output format: [12 bytes IV][16 bytes auth tag][...ciphertext]
 */
export function encrypt(data: Buffer, key: Buffer): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]);
}

/**
 * Decrypt AES-256-GCM encrypted data.
 */
export function decrypt(data: Buffer, key: Buffer): Buffer {
  const iv = data.subarray(0, 12);
  const authTag = data.subarray(12, 28);
  const ciphertext = data.subarray(28);

  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}
