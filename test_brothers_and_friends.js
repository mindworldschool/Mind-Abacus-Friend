/**
 * Тест: Братья И Друзья одновременно
 */

import { generateExample } from './ext/core/generator.js';

console.log('🧪 Тест: Братья И Друзья одновременно\n');

const settings = {
  digits: 2,
  actions: { count: 12 },
  blocks: {
    simple: {
      digits: [1, 2, 3, 4, 5, 6, 7, 8, 9]
    },
    brothers: {
      digits: [1, 2, 3, 4]
    },
    friends: {
      digits: [1, 2, 3, 4, 5, 6, 7, 8, 9]
    }
  }
};

console.log('Настройки:');
console.log('- Братья: [1, 2, 3, 4]');
console.log('- Друзья: [1, 2, 3, 4, 5, 6, 7, 8, 9]');
console.log('- Шагов: 12\n');

try {
  const example = generateExample(settings);

  if (example && example.steps) {
    console.log(`✅ Пример сгенерирован!`);
    console.log(`   Шагов: ${example.steps.length}`);
    console.log(`   Ответ: ${example.answer}`);

    // Проверим, какое правило использовано
    const hasFriends = example.steps.some(s => typeof s === 'object' && s.isFriend);
    const hasBrothers = example.steps.some(s => typeof s === 'object' && s.isBrother);
    console.log(`   Friends: ${hasFriends ? 'ДА' : 'НЕТ'}`);
    console.log(`   Brothers: ${hasBrothers ? 'ДА' : 'НЕТ'}`);

    // Показываем первые 6 шагов
    console.log('\n   Первые шаги:');
    example.steps.slice(0, 6).forEach((step, idx) => {
      if (typeof step === 'object') {
        if (step.isFriend) {
          console.log(`     ${idx + 1}. ${step.step} (Friends)`);
        } else if (step.isBrother) {
          console.log(`     ${idx + 1}. ${step.step} (Brothers)`);
        }
      } else {
        console.log(`     ${idx + 1}. ${step}`);
      }
    });
  } else {
    console.log('❌ Пример не сгенерирован');
  }
} catch (error) {
  console.log(`❌ Ошибка: ${error.message}`);
  console.log(error.stack);
}
