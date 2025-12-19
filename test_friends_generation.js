/**
 * Тест: проверка генерации примеров с правилом Друзья
 *
 * Проверяем, что генератор действительно создает примеры с Friends действиями
 */

import { FriendsExampleGenerator } from './ext/core/FriendsExampleGenerator.js';

console.log('🧪 ТЕСТ: Проверка генерации примеров с правилом Друзья');
console.log('======================================================\n');

// Настройки: Friends для 1 и 2, Просто 1-4, 8 действий
const config = {
  selectedDigits: [1, 2],  // Friends цифры
  digitCount: 2,
  stepsCount: 8,
  blocks: {
    simple: {
      digits: [1, 2, 3, 4]  // Просто цифры
    }
  }
};

console.log('⚙️ Настройки:');
console.log(`  Friends цифры: [${config.selectedDigits.join(', ')}]`);
console.log(`  Просто цифры: [${config.blocks.simple.digits.join(', ')}]`);
console.log(`  Количество шагов: ${config.stepsCount}\n`);

const generator = new FriendsExampleGenerator(config);

// Генерируем несколько примеров
const examplesCount = 3;
let successCount = 0;
let friendsCount = 0;

for (let i = 0; i < examplesCount; i++) {
  console.log(`\n📝 Пример ${i + 1}:`);
  console.log('─'.repeat(60));

  const example = generator.generate();

  if (!example || !example.steps || example.steps.length === 0) {
    console.error('❌ Не удалось сгенерировать пример!');
    continue;
  }

  // Выводим пример
  const actionsStr = example.steps.map(s => {
    const sign = s.action >= 0 ? '+' : '';
    return s.isFriend ? `${sign}${s.action}(F)` : `${sign}${s.action}`;
  }).join(' ');

  console.log(`Действия: ${actionsStr}`);
  console.log(`Ответ: ${example.answer.join('')}`);

  // Считаем Friends действия
  const friendSteps = example.steps.filter(s => s.isFriend);
  console.log(`\nFriends действий: ${friendSteps.length}`);

  if (friendSteps.length > 0) {
    friendSteps.forEach((step, idx) => {
      console.log(`  Friends ${idx + 1}: ${step.action >= 0 ? '+' : ''}${step.action} (цифра ${step.friendN})`);
    });
    successCount++;
    friendsCount += friendSteps.length;
  } else {
    console.log('  ⚠️ НЕТ Friends действий в примере!');
  }
}

console.log('\n' + '='.repeat(60));
console.log(`Результаты:`);
console.log(`  Примеры с Friends: ${successCount}/${examplesCount}`);
console.log(`  Всего Friends действий: ${friendsCount}`);

if (successCount === examplesCount && friendsCount >= examplesCount) {
  console.log('\n✅ ТЕСТ ПРОЙДЕН!');
  console.log('Генератор создает примеры с правилом Друзья.');
} else {
  console.log('\n❌ ТЕСТ НЕ ПРОЙДЕН!');
  console.log('Генератор не создает достаточно примеров с Friends.');
  process.exit(1);
}
