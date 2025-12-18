// Тест для friendDigit=8 с разнообразием

import { FriendsExampleGenerator } from './ext/core/FriendsExampleGenerator.js';

console.log('='.repeat(80));
console.log('ТЕСТ: friendDigit=8, РАЗНООБРАЗИЕ ОСТАТКОВ');
console.log('='.repeat(80));

for (let i = 1; i <= 5; i++) {
  console.log(`\n📊 ПРИМЕР ${i}:`);
  console.log('-'.repeat(40));

  const gen = new FriendsExampleGenerator({
    selectedDigits: [8],  // friendDigit=8, требуется 2, диапазон 2-9
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
  }
}

console.log('\n' + '='.repeat(80));
console.log('✅ Для friendDigit=8 единицы после Friends могут быть: 0,1,2,3,4,5,6,7!');
console.log('='.repeat(80));
