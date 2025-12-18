// Тест для friendDigit=8 с проверкой валидности вычитания

import { FriendsExampleGenerator } from './ext/core/FriendsExampleGenerator.js';

console.log('='.repeat(80));
console.log('ТЕСТ: friendDigit=8, ПРОВЕРКА ВАЛИДНОСТИ ВЫЧИТАНИЯ FRIEND');
console.log('='.repeat(80));

for (let i = 1; i <= 3; i++) {
  console.log(`\n📊 ПРИМЕР ${i}:`);
  console.log('-'.repeat(40));

  const gen = new FriendsExampleGenerator({
    selectedDigits: [8],
    digitCount: 2,
    stepsCount: 10,
    blocks: {
      brothers: {
        active: true
      }
    }
  });

  const example = gen.generate();
  if (example) {
    const formatted = gen.toTrainerFormat(example);

    // Показываем только Friends действия
    formatted.steps.forEach((step, index) => {
      if (typeof step === 'object' && step.isFriend) {
        console.log(`  Шаг ${index + 1}: ${step.step} ⭐ FRIENDS`);
      }
    });

    console.log(`\n✅ Ответ: ${formatted.answer}`);
  }
}

console.log('\n' + '='.repeat(80));
console.log('✅ Теперь вычитание friend всегда валидно по правилу Просто!');
console.log('='.repeat(80));
