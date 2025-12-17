// Тест для двузначных с friendDigit=2

import { FriendsExampleGenerator } from './ext/core/FriendsExampleGenerator.js';

console.log('='.repeat(80));
console.log('ТЕСТ: digitCount=2 (двузначные), friendDigit=2, brothersActive=true');
console.log('='.repeat(80));

const gen = new FriendsExampleGenerator({
  selectedDigits: [2],  // Цифра 2: требует состояние единиц = 8
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
  console.log('\n✅ Пример сгенерирован:');
  const formatted = gen.toTrainerFormat(example);
  console.log(JSON.stringify(formatted, null, 2));

  const friendSteps = example.steps.filter(s => s.isFriend);
  console.log(`\n📊 Всего шагов: ${example.steps.length}`);
  console.log(`🤝 Шагов Friends: ${friendSteps.length}`);

  // Проверяем правильность примера
  let sum = 0;
  for (const step of formatted.steps) {
    if (typeof step === 'string') {
      sum += parseInt(step);
    } else {
      sum += parseInt(step.step);
    }
  }
  console.log(`🧮 Проверка: сумма действий = ${sum}, ответ = ${formatted.answer}`);
  console.log(sum === formatted.answer ? '✅ Проверка прошла' : '❌ Ошибка в вычислениях');
} else {
  console.error('❌ Не удалось сгенерировать пример');
}

console.log('\n' + '='.repeat(80));
