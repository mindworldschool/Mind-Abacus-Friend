/**
 * Тест: проверка генерации 12 шагов с Friends [1, 8, 9]
 */

import { FriendsExampleGenerator } from './ext/core/FriendsExampleGenerator.js';

console.log('🧪 ТЕСТ: Генерация 12 шагов с Friends [1, 8, 9]');
console.log('='.repeat(60));

const config = {
  selectedDigits: [1, 8, 9],
  digitCount: 2,
  stepsCount: 12,
  blocks: {
    simple: {
      digits: [1, 2, 3, 4, 5, 6, 7, 8, 9]  // Все цифры доступны
    }
  }
};

console.log('\n⚙️ Настройки:');
console.log(`  Friends цифры: [${config.selectedDigits.join(', ')}]`);
console.log(`  Просто цифры: [${config.blocks.simple.digits.join(', ')}]`);
console.log(`  Количество шагов: ${config.stepsCount}\n`);

const generator = new FriendsExampleGenerator(config);

console.log('\n🚀 Попытка генерации...\n');

const example = generator.generate();

if (example && example.steps && example.steps.length > 0) {
  const actionsStr = example.steps.map(s => {
    const sign = s.action >= 0 ? '+' : '';
    return s.isFriend ? `${sign}${s.action}(F${s.friendN})` : `${sign}${s.action}`;
  }).join(' ');

  console.log(`\n✅ Пример сгенерирован!`);
  console.log(`Действия (${example.steps.length}): ${actionsStr}`);
  console.log(`Ответ: ${example.answer.join('')}`);

  const friendSteps = example.steps.filter(s => s.isFriend);
  console.log(`\nFriends действий: ${friendSteps.length}`);
  friendSteps.forEach((step, idx) => {
    console.log(`  Friends ${idx + 1}: ${step.action >= 0 ? '+' : ''}${step.action} (цифра ${step.friendN})`);
  });
} else {
  console.log('\n❌ НЕ УДАЛОСЬ СГЕНЕРИРОВАТЬ ПРИМЕР!');
  process.exit(1);
}
