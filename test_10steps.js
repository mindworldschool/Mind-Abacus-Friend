// Тест для 10 шагов с несколькими Friends

import { FriendsExampleGenerator } from './ext/core/FriendsExampleGenerator.js';

console.log('='.repeat(80));
console.log('ТЕСТ: 10 ШАГОВ, НЕСКОЛЬКО FRIENDS');
console.log('='.repeat(80));

for (let i = 1; i <= 3; i++) {
  console.log(`\n📊 ПРИМЕР ${i}:`);
  console.log('-'.repeat(40));

  const gen = new FriendsExampleGenerator({
    selectedDigits: [1],
    digitCount: 2,
    stepsCount: 10, // 10 шагов!
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

    // Показываем последовательность
    const stepsStr = formatted.steps.map(step => {
      if (typeof step === 'string') {
        return step;
      } else {
        return `${step.step}(F)`;
      }
    }).join(' → ');

    console.log(`Шаги: ${stepsStr}`);
    console.log(`Ответ: ${formatted.answer}`);
    console.log(`🤝 Количество Friends: ${friendsCount}/10 шагов`);
  }
}

console.log('\n' + '='.repeat(80));
console.log('✅ Для 10 шагов должно быть 2-3 Friends действия!');
console.log('='.repeat(80));
