/**
 * Тест: проверка всех цифр Friends [1-9]
 */

import { FriendsExampleGenerator } from './ext/core/FriendsExampleGenerator.js';

console.log('🧪 ТЕСТ: Проверка каждой цифры Friends отдельно\n');

const baseConfig = {
  digitCount: 2,
  stepsCount: 12,
  blocks: {
    simple: {
      digits: [1, 2, 3, 4, 5, 6, 7, 8, 9]
    }
  }
};

// Тестируем каждую цифру отдельно
for (let digit = 1; digit <= 9; digit++) {
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`📋 Тестируем цифру Friends: ${digit}`);
  console.log('─'.repeat(50));

  const config = {
    ...baseConfig,
    selectedDigits: [digit]
  };

  let success = 0;
  let failed = 0;

  for (let i = 0; i < 5; i++) {
    try {
      const generator = new FriendsExampleGenerator(config);
      const example = generator.generate();

      if (example && example.steps && example.steps.length === 12) {
        const friendsCount = example.steps.filter(s => s.isFriend).length;
        if (friendsCount > 0) {
          success++;
        } else {
          console.log(`  ${i + 1}. ❌ Нет Friends действий`);
          failed++;
        }
      } else {
        console.log(`  ${i + 1}. ❌ Неверное количество шагов`);
        failed++;
      }
    } catch (error) {
      console.log(`  ${i + 1}. ❌ Ошибка: ${error.message}`);
      failed++;
    }
  }

  if (success === 5) {
    console.log(`✅ Цифра ${digit}: 5/5 успешно`);
  } else {
    console.log(`❌ Цифра ${digit}: ${success}/5 успешно, ${failed} провалов`);
  }
}

console.log(`\n${'='.repeat(50)}\n`);

// Теперь тестируем все вместе
console.log('📋 Тестируем ВСЕ цифры [1-9] вместе\n');

const allConfig = {
  ...baseConfig,
  selectedDigits: [1, 2, 3, 4, 5, 6, 7, 8, 9]
};

let allSuccess = 0;
let allFailed = 0;

for (let i = 0; i < 10; i++) {
  try {
    const generator = new FriendsExampleGenerator(allConfig);
    const example = generator.generate();

    if (example && example.steps && example.steps.length === 12) {
      const friendsCount = example.steps.filter(s => s.isFriend).length;
      if (friendsCount > 0) {
        allSuccess++;
      } else {
        console.log(`  ${i + 1}. ❌ Нет Friends действий`);
        allFailed++;
      }
    } else {
      console.log(`  ${i + 1}. ❌ Неверное количество шагов`);
      allFailed++;
    }
  } catch (error) {
    console.log(`  ${i + 1}. ❌ Ошибка: ${error.message}`);
    allFailed++;
  }
}

console.log(`\n${'='.repeat(50)}`);
if (allSuccess === 10) {
  console.log(`✅ ВСЕ цифры [1-9]: 10/10 успешно`);
} else {
  console.log(`❌ ВСЕ цифры [1-9]: ${allSuccess}/10 успешно, ${allFailed} провалов`);
}
