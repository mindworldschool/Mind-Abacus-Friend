// Тест для 20 шагов с несколькими Friends

import { FriendsExampleGenerator } from './ext/core/FriendsExampleGenerator.js';

console.log('='.repeat(80));
console.log('ТЕСТ: 20 ШАГОВ, ЕЩЕ БОЛЬШЕ FRIENDS');
console.log('='.repeat(80));

const gen = new FriendsExampleGenerator({
  selectedDigits: [1],
  digitCount: 2,
  stepsCount: 20, // 20 шагов!
  blocks: {
    brothers: {
      active: true
    }
  }
});

const example = gen.generate();
if (example) {
  const formatted = gen.toTrainerFormat(example);

  // Подсчитываем Friends
  const friendsCount = formatted.steps.filter(step =>
    typeof step === 'object' && step.isFriend
  ).length;

  // Показываем последовательность с отступами
  console.log('\nПоследовательность шагов:');
  formatted.steps.forEach((step, index) => {
    if (typeof step === 'string') {
      console.log(`  ${index + 1}. ${step}`);
    } else {
      console.log(`  ${index + 1}. ${step.step} ⭐ FRIENDS`);
    }
  });

  console.log(`\n📊 Ответ: ${formatted.answer}`);
  console.log(`🤝 Количество Friends: ${friendsCount}/20 шагов`);
  console.log(`📈 Процент Friends: ${Math.round(friendsCount / 20 * 100)}%`);
}

console.log('\n' + '='.repeat(80));
console.log('✅ Для 20 шагов ожидаем 5-6 Friends действий!');
console.log('='.repeat(80));
