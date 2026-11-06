import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rankCards } from '../public/card-search.js';
const cards = [
  { id:'gpo', title:'Групові політики', description:'Windows', command:'gpupdate /force', platforms:['windows'], body:'Перегляд журналу: Get-WinEvent -LogName Application', tags:['gpo'] },
  { id:'mc', title:'Midnight Commander', description:'Копіювання файлів', command:'F5', platforms:['linux'], body:'', tags:['mc','shortcuts'] },
  { id:'log', title:'Get-WinEvent', description:'Журнал', command:'Get-WinEvent', platforms:['windows'], body:'', tags:[] },
];
test('search includes instruction text and ranks exact command/title first', () => {
  assert.deepEqual(rankCards(cards,'get-winevent').map(c=>c.id),['log','gpo']);
});
test('search normalizes case and finds tags, platforms and multiple words', () => {
  assert.equal(rankCards(cards,'  MC  ')[0].id,'mc');
  assert.deepEqual(rankCards(cards,'Windows Get-WinEvent').map(c=>c.id),['log','gpo']);
  assert.deepEqual(rankCards(cards,'неіснуючий запит'),[]);
  assert.equal(rankCards(cards,'').length,3);
});
