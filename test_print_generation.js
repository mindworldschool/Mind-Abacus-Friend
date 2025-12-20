/**
 * Тест: генерация 10 примеров для печати (как в реальном worksheetGenerator)
 */

import { FriendsExampleGenerator } from './ext/core/FriendsExampleGenerator.js';

const config = {
  selectedDigits: [1, 8, 9],
  digitCount: 2,
  stepsCount: 12,
  blocks: {
    simple: {
      digits: [1, 2, 3, 4, 5, 6, 7, 8, 9]
    }
  }
};

console.log('🧪 Тест: Генерация 10 примеров для печати...\n');

let successCount = 0;
let totalFriendsCount = 0;

for (let i = 0; i < 10; i++) {
  console.log(`Пример ${i + 1}...`);
  const generator = new FriendsExampleGenerator(config);
  const example = generator.generate();

  if (example && example.steps && example.steps.length === 12) {
    const friendsCount = example.steps.filter(s => s.isFriend).length;
    console.log(`  ✅ Успех: ${friendsCount} Friends`);
    successCount++;
    totalFriendsCount += friendsCount;
  } else {
    console.log('  ❌ ПРОВАЛ');
  }
}

console.log('\n' + '='.repeat(60));
console.log(`Результат: ${successCount}/10 примеров сгенерированы`);
if (successCount > 0) {
  console.log(`Среднее количество Friends: ${(totalFriendsCount / successCount).toFixed(1)}`);
}

if (successCount === 10) {
  console.log('✅ ВСЕ 10 ПРИМЕРОВ УСПЕШНО СГЕНЕРИРОВАНЫ!');
} else {
  console.log(`❌ ПРОВАЛ: только ${successCount} из 10`);
  process.exit(1);
}
