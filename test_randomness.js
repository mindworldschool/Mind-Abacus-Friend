// Тест для проверки случайности примеров

import { FriendsExampleGenerator } from './ext/core/FriendsExampleGenerator.js';

console.log('='.repeat(80));
console.log('ТЕСТ СЛУЧАЙНОСТИ: Генерируем 5 примеров подряд');
console.log('='.repeat(80));

for (let i = 1; i <= 5; i++) {
  console.log(`\n🎲 ПРИМЕР ${i}:`);
  console.log('-'.repeat(40));

  const gen = new FriendsExampleGenerator({
    selectedDigits: [1],
    digitCount: 2,
    stepsCount: 7,
    blocks: {
      brothers: {
        active: true
      }
    }
  });

  const example = gen.generate();
  if (example) {
    const formatted = gen.toTrainerFormat(example);

    // Показываем только последовательность шагов
    const stepsStr = formatted.steps.map(step => {
      if (typeof step === 'string') {
        return step;
      } else {
        return `${step.step}(F)`;
      }
    }).join(' → ');

    console.log(`Шаги: ${stepsStr}`);
    console.log(`Ответ: ${formatted.answer}`);
  }
}

console.log('\n' + '='.repeat(80));
console.log('✅ Все 5 примеров должны быть РАЗНЫМИ!');
console.log('='.repeat(80));
