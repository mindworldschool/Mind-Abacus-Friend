import { FriendsExampleGenerator } from './ext/core/FriendsExampleGenerator.js';

console.log('=== ТЕСТ: Проверка минимизации круглых чисел ===\n');

// Тест для двузначных
console.log('Двузначные (digitCount=2):');
const config2 = {
  digitCount: 2,
  stepsCount: 8,
  minDigit: 1,
  maxDigit: 9
};

const gen2 = new FriendsExampleGenerator(config2);
const example2 = gen2.generate();

if (example2 && example2.steps) {
  console.log('Действия:', example2.steps.map(s => (s.action >= 0 ? '+' : '') + s.action).join(', '));

  // Подсчет круглых чисел (заканчивающихся на 0)
  const actions = example2.steps.map(s => s.action);
  const roundCount2 = actions.filter(a => Math.abs(a) % 10 === 0).length;
  console.log('Круглых чисел:', roundCount2, '/', actions.length);
  console.log('Процент круглых:', Math.round(roundCount2 / actions.length * 100) + '%');
} else {
  console.log('❌ Не удалось сгенерировать');
}

console.log('\n---\n');

// Тест для трехзначных
console.log('Трехзначные (digitCount=3):');
const config3 = {
  digitCount: 3,
  stepsCount: 8,
  minDigit: 1,
  maxDigit: 9
};

const gen3 = new FriendsExampleGenerator(config3);
const example3 = gen3.generate();

if (example3 && example3.steps) {
  console.log('Действия:', example3.steps.map(s => (s.action >= 0 ? '+' : '') + s.action).join(', '));

  // Подсчет круглых чисел (заканчивающихся на 0 в младшем разряде)
  const actions3 = example3.steps.map(s => s.action);
  const roundCount3 = actions3.filter(a => Math.abs(a) % 10 === 0).length;
  console.log('Круглых чисел (оканчивающихся на 0):', roundCount3, '/', actions3.length);
  console.log('Процент круглых:', Math.round(roundCount3 / actions3.length * 100) + '%');

  // Детальный анализ
  console.log('\nДетальный анализ:');
  actions3.forEach((val, i) => {
    const absVal = Math.abs(val);
    const units = absVal % 10;
    const tens = Math.floor(absVal / 10) % 10;
    const hundreds = Math.floor(absVal / 100);
    console.log(`  ${i+1}. ${val >= 0 ? '+' : '-'}${absVal} -> сотни=${hundreds}, десятки=${tens}, единицы=${units}`);
  });
} else {
  console.log('❌ Не удалось сгенерировать');
}

console.log('\n---\n');

// Множественный тест для статистики
console.log('Статистика по 20 примерам (digitCount=2):');
let totalRound = 0;
let totalActions = 0;
let successCount = 0;

for (let i = 0; i < 20; i++) {
  const gen = new FriendsExampleGenerator(config2);
  const ex = gen.generate();

  if (ex && ex.steps) {
    successCount++;
    const actions = ex.steps.map(s => s.action);
    const round = actions.filter(a => Math.abs(a) % 10 === 0).length;
    totalRound += round;
    totalActions += actions.length;
  }
}

console.log('Успешно сгенерировано:', successCount, '/ 20');
console.log('Всего действий:', totalActions);
console.log('Круглых чисел:', totalRound);
console.log('Средний % круглых:', Math.round(totalRound / totalActions * 100) + '%');
console.log('\n✅ Ожидаемый результат: < 10% круглых чисел (в идеале 0-5%)');
