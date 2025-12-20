/**
 * Тест: минимальное количество шагов для Друзья
 */

import { FriendsExampleGenerator } from './ext/core/FriendsExampleGenerator.js';

console.log('🧪 Тест: Минимум шагов для Друзья с автокоррекцией\n');

const config = {
  selectedDigits: [1, 2],
  digitCount: 2,
  stepsCount: 3, // Слишком мало!
  blocks: {
    simple: {
      digits: [1, 2, 3, 4, 5, 6, 7, 8, 9]
    }
  }
};

console.log('Запрошено: 3 шага (слишком мало для Друзья)\n');
const generator = new FriendsExampleGenerator(config);
console.log(`Реально будет: ${generator.config.stepsCount} шага (после автокоррекции)\n`);

const example = generator.generate();

if (example && example.steps) {
  const friendsCount = example.steps.filter(s => s.isFriend).length;
  console.log(`✅ Пример успешно сгенерирован!`);
  console.log(`   Шагов: ${example.steps.length}`);
  console.log(`   Friends: ${friendsCount}`);

  const actionsStr = example.steps.map(s => {
    const sign = s.action >= 0 ? '+' : '';
    return s.isFriend ? `${sign}${s.action}(F)` : `${sign}${s.action}`;
  }).join(' ');
  console.log(`   Действия: ${actionsStr}`);
} else {
  console.log('❌ НЕ УДАЛОСЬ СГЕНЕРИРОВАТЬ');
  process.exit(1);
}
