/**
 * Тест: тихий режим для печати
 */

import { generateExample } from './ext/core/generator.js';

console.log('🧪 Тест: Тихий режим (silent=true)\n');

const settings = {
  digits: 2,
  actions: { count: 12 },
  blocks: {
    simple: {
      digits: [1, 2, 3, 4, 5, 6, 7, 8, 9]
    },
    friends: {
      digits: [1, 2, 3, 4, 5, 6, 7, 8, 9]
    }
  },
  silent: true  // ВКЛ��ЧАЕМ ТИХИЙ РЕЖИМ
};

console.log('Генерация 3 примеров с silent=true...\n');
console.log('Вы НЕ должны видеть логи из fallback:\n');

for (let i = 0; i < 3; i++) {
  console.log(`\n=== Пример ${i + 1} ===`);

  const startTime = Date.now();
  const example = generateExample(settings);
  const endTime = Date.now();

  if (example && example.steps) {
    const friendsCount = example.steps.filter(s => typeof s === 'object' && s.isFriend).length;
    console.log(`✅ Сгенерирован: ${example.steps.length} шагов, ${friendsCount} Friends`);
    console.log(`   Время: ${endTime - startTime}ms`);
  } else {
    console.log('❌ НЕ СГЕНЕРИРОВАН');
  }
}

console.log('\n\n🎉 Если вы видите только эти сообщения (без логов fallback) - тихий режим работает!');
