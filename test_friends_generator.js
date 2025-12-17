// Тестовый скрипт для проверки FriendsExampleGenerator

import { FriendsExampleGenerator } from './ext/core/FriendsExampleGenerator.js';

console.log('='.repeat(80));
console.log('ТЕСТИРОВАНИЕ FRIENDSEXAMPLEGENERATOR');
console.log('='.repeat(80));

// ТЕСТ 1: Базовая генерация (двузначные, цифра 1, 7 шагов)
console.log('\n📋 ТЕСТ 1: Двузначные, цифра Friends = 1, 7 шагов');
console.log('-'.repeat(80));

const gen1 = new FriendsExampleGenerator({
  selectedDigits: [1],
  digitCount: 2,
  stepsCount: 7,
  brothersActive: false
});

const example1 = gen1.generate();
if (example1) {
  console.log('\n✅ Пример сгенерирован:');
  console.log('Формат для тренера:', JSON.stringify(gen1.toTrainerFormat(example1), null, 2));
} else {
  console.error('❌ Не удалось сгенерировать пример');
}

// ТЕСТ 2: Больше шагов (10 шагов)
console.log('\n\n📋 ТЕСТ 2: Двузначные, цифра Friends = 1, 10 шагов');
console.log('-'.repeat(80));

const gen2 = new FriendsExampleGenerator({
  selectedDigits: [1],
  digitCount: 2,
  stepsCount: 10,
  brothersActive: false
});

const example2 = gen2.generate();
if (example2) {
  console.log('\n✅ Пример сгенерирован:');
  console.log('Формат для тренера:', JSON.stringify(gen2.toTrainerFormat(example2), null, 2));
} else {
  console.error('❌ Не удалось сгенерировать пример');
}

// ТЕСТ 3: Несколько цифр Friends ([1, 2, 3])
console.log('\n\n📋 ТЕСТ 3: Двузначные, цифры Friends = [1, 2, 3], 10 шагов');
console.log('-'.repeat(80));

const gen3 = new FriendsExampleGenerator({
  selectedDigits: [1, 2, 3],
  digitCount: 2,
  stepsCount: 10,
  brothersActive: false
});

const example3 = gen3.generate();
if (example3) {
  console.log('\n✅ Пример сгенерирован:');
  console.log('Формат для тренера:', JSON.stringify(gen3.toTrainerFormat(example3), null, 2));

  // Проверяем разнообразие использованных цифр
  const friendSteps = example3.steps.filter(s => s.isFriend);
  const usedDigits = friendSteps.map(s => s.friendN);
  console.log('\n📊 Статистика использования цифр Friends:', usedDigits);
} else {
  console.error('❌ Не удалось сгенерировать пример');
}

// ТЕСТ 4: Трехзначные (целевой разряд = сотни)
console.log('\n\n📋 ТЕСТ 4: Трехзначные, цифра Friends = 1, 7 шагов');
console.log('-'.repeat(80));

const gen4 = new FriendsExampleGenerator({
  selectedDigits: [1],
  digitCount: 3,
  stepsCount: 7,
  brothersActive: false
});

const example4 = gen4.generate();
if (example4) {
  console.log('\n✅ Пример сгенерирован:');
  console.log('Формат для тренера:', JSON.stringify(gen4.toTrainerFormat(example4), null, 2));
} else {
  console.error('❌ Не удалось сгенерировать пример');
}

// ТЕСТ 5: С активными Братьями
console.log('\n\n📋 ТЕСТ 5: Двузначные, цифра Friends = 1, 7 шагов, Братья активны');
console.log('-'.repeat(80));

const gen5 = new FriendsExampleGenerator({
  selectedDigits: [1],
  digitCount: 2,
  stepsCount: 7,
  brothersActive: true
});

const example5 = gen5.generate();
if (example5) {
  console.log('\n✅ Пример сгенерирован:');
  console.log('Формат для тренера:', JSON.stringify(gen5.toTrainerFormat(example5), null, 2));
} else {
  console.error('❌ Не удалось сгенерировать пример');
}

// ТЕСТ 6: Большое количество шагов (50 шагов)
console.log('\n\n📋 ТЕСТ 6: Двузначные, цифры Friends = [1, 2], 50 шагов');
console.log('-'.repeat(80));

const gen6 = new FriendsExampleGenerator({
  selectedDigits: [1, 2],
  digitCount: 2,
  stepsCount: 50,
  brothersActive: false
});

const example6 = gen6.generate();
if (example6) {
  console.log('\n✅ Пример сгенерирован!');
  const friendSteps = example6.steps.filter(s => s.isFriend);
  console.log(`📊 Всего шагов: ${example6.steps.length}`);
  console.log(`🤝 Шагов Friends: ${friendSteps.length}`);
  console.log(`📈 Процент Friends: ${((friendSteps.length / example6.steps.length) * 100).toFixed(1)}%`);

  // Показываем только первые 10 и последние 10 шагов
  const formatted = gen6.toTrainerFormat(example6);
  console.log('\nПервые 10 шагов:', formatted.steps.slice(0, 10));
  console.log('\nПоследние 10 шагов:', formatted.steps.slice(-10));
  console.log('\nФинальный ответ:', formatted.answer);
} else {
  console.error('❌ Не удалось сгенерировать пример');
}

console.log('\n' + '='.repeat(80));
console.log('ТЕСТИРОВАНИЕ ЗАВЕРШЕНО');
console.log('='.repeat(80));
