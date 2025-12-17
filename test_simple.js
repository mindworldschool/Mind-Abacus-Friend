// Простой тест для fallback

import { FriendsExampleGenerator } from './ext/core/FriendsExampleGenerator.js';

console.log('='.repeat(80));
console.log('ПРОСТОЙ ТЕСТ: brothersActive = true');
console.log('='.repeat(80));

const gen = new FriendsExampleGenerator({
  selectedDigits: [1],
  digitCount: 2,
  stepsCount: 7,
  brothersActive: true  // ВАЖНО: включаем Братья!
});

const example = gen.generate();
if (example) {
  console.log('\n✅ Пример сгенерирован:');
  const formatted = gen.toTrainerFormat(example);
  console.log(JSON.stringify(formatted, null, 2));

  const friendSteps = example.steps.filter(s => s.isFriend);
  console.log(`\n📊 Всего шагов: ${example.steps.length}`);
  console.log(`🤝 Шагов Friends: ${friendSteps.length}`);
} else {
  console.error('❌ Не удалось сгенерировать пример');
}

console.log('\n' + '='.repeat(80));
