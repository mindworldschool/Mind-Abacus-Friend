/**
 * Тест: проверка соблюдения ограничений по цифрам
 *
 * Проверяем, что генератор использует только те цифры,
 * которые указаны в настройках selectedDigits (Friends) и simpleDigits (Просто)
 */

import { FriendsExampleGenerator } from './ext/core/FriendsExampleGenerator.js';

console.log('🧪 ТЕСТ: Проверка ограничений по цифрам');
console.log('========================================\n');

// Настройки: Friends только для 1 и 2, Просто только 1-4
const config = {
  selectedDigits: [1, 2],  // Только эти цифры для Friends
  digitCount: 2,
  stepsCount: 8,
  blocks: {
    simple: {
      digits: [1, 2, 3, 4]  // Только эти цифры для простых действий
    }
  }
};

console.log('⚙️ Настройки:');
console.log(`  Friends цифры: [${config.selectedDigits.join(', ')}]`);
console.log(`  Просто цифры: [${config.blocks.simple.digits.join(', ')}]`);
console.log(`  Количество шагов: ${config.stepsCount}\n`);

const generator = new FriendsExampleGenerator(config);

// Генерируем несколько примеров для проверки
const examplesCount = 5;
let allPassed = true;

for (let i = 0; i < examplesCount; i++) {
  console.log(`\n📝 Пример ${i + 1}:`);
  console.log('─'.repeat(50));

  const example = generator.generate();

  if (!example || !example.steps || example.steps.length === 0) {
    console.error('❌ Не удалось сгенерировать пример!');
    allPassed = false;
    continue;
  }

  // Выводим пример
  const actionsStr = example.steps.map(s => {
    const sign = s.action >= 0 ? '+' : '';
    return s.isFriend ? `${sign}${s.action}(F)` : `${sign}${s.action}`;
  }).join(' ');

  console.log(`Действия: ${actionsStr}`);

  // Проверяем каждое действие
  let examplePassed = true;

  for (let j = 0; j < example.steps.length; j++) {
    const step = example.steps[j];
    const actionValue = Math.abs(step.action);

    if (step.isFriend) {
      // Friends действие - должно использовать только 1 или 2
      if (!config.selectedDigits.includes(step.friendN)) {
        console.error(`  ❌ Шаг ${j + 1}: Friends использует цифру ${step.friendN}, но разрешены только [${config.selectedDigits.join(', ')}]`);
        examplePassed = false;
        allPassed = false;
      } else {
        console.log(`  ✅ Шаг ${j + 1}: Friends ${step.action >= 0 ? '+' : ''}${step.action} использует разрешенную цифру ${step.friendN}`);
      }
    } else {
      // Простое действие - должно использовать только 1, 2, 3, 4
      if (!config.blocks.simple.digits.includes(actionValue)) {
        console.error(`  ❌ Шаг ${j + 1}: Просто использует цифру ${actionValue}, но разрешены только [${config.blocks.simple.digits.join(', ')}]`);
        examplePassed = false;
        allPassed = false;
      }
    }
  }

  if (examplePassed) {
    console.log(`\n✅ Пример ${i + 1} ПРОШЕЛ проверку`);
  } else {
    console.log(`\n❌ Пример ${i + 1} НЕ ПРОШЕЛ проверку`);
  }
}

console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('✅ ВСЕ ТЕСТЫ ПРОЙДЕНЫ!');
  console.log('Генератор корректно соблюдает ограничения по цифрам.');
} else {
  console.log('❌ ТЕСТЫ НЕ ПРОЙДЕНЫ!');
  console.log('Генератор использует цифры, не указанные в настройках.');
  process.exit(1);
}
