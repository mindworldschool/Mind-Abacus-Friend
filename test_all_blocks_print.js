/**
 * Комплексный тест: печать для всех блоков
 */

import { generateExample } from './ext/core/generator.js';

console.log('🧪 ТЕСТ: Генерация для печати - ВСЕ БЛОКИ');
console.log('='.repeat(70));

// Тестовые конфигурации для каждого блока
const testConfigs = [
  {
    name: 'Просто (1-9, 12 шагов)',
    settings: {
      digits: 1,
      actions: { count: 12 },
      blocks: {
        simple: {
          digits: [1, 2, 3, 4, 5, 6, 7, 8, 9],
          includeFive: true
        }
      }
    }
  },
  {
    name: 'Просто (1-4, 8 шагов)',
    settings: {
      digits: 1,
      actions: { count: 8 },
      blocks: {
        simple: {
          digits: [1, 2, 3, 4],
          includeFive: false
        }
      }
    }
  },
  {
    name: 'Братья (цифра 4, 10 шагов)',
    settings: {
      digits: 1,
      actions: { count: 10 },
      blocks: {
        simple: {
          digits: [1, 2, 3, 4, 5, 6, 7, 8, 9],
          includeFive: true
        },
        brothers: {
          digits: [4]
        }
      }
    }
  },
  {
    name: 'Братья (1,2,3, 8 шагов)',
    settings: {
      digits: 1,
      actions: { count: 8 },
      blocks: {
        simple: {
          digits: [1, 2, 3, 4, 5, 6, 7, 8, 9],
          includeFive: true
        },
        brothers: {
          digits: [1, 2, 3]
        }
      }
    }
  },
  {
    name: 'Друзья (1,2, 8 шагов)',
    settings: {
      digits: 2,
      actions: { count: 8 },
      blocks: {
        simple: {
          digits: [1, 2, 3, 4, 5, 6, 7, 8, 9]
        },
        friends: {
          digits: [1, 2]
        }
      }
    }
  },
  {
    name: 'Друзья (1,8,9, 12 шагов)',
    settings: {
      digits: 2,
      actions: { count: 12 },
      blocks: {
        simple: {
          digits: [1, 2, 3, 4, 5, 6, 7, 8, 9]
        },
        friends: {
          digits: [1, 8, 9]
        }
      }
    }
  },
  {
    name: 'Друзья (5, 10 шагов)',
    settings: {
      digits: 2,
      actions: { count: 10 },
      blocks: {
        simple: {
          digits: [1, 2, 3, 4, 5, 6, 7, 8, 9]
        },
        friends: {
          digits: [5]
        }
      }
    }
  }
];

let totalTests = 0;
let totalSuccess = 0;
let totalFailed = 0;

for (const config of testConfigs) {
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`📋 Тест: ${config.name}`);
  console.log('─'.repeat(70));

  let success = 0;
  let failed = 0;
  const examplesCount = 10;

  for (let i = 0; i < examplesCount; i++) {
    try {
      const example = generateExample(config.settings);

      if (!example || !example.steps || !Array.isArray(example.steps)) {
        console.log(`  ${i + 1}. ❌ Пример не сгенерирован (пустой результат)`);
        failed++;
        continue;
      }

      const expectedSteps = config.settings.actions.count;
      const actualSteps = example.steps.length;

      if (actualSteps !== expectedSteps) {
        console.log(`  ${i + 1}. ❌ Неверное количество шагов: ${actualSteps} вместо ${expectedSteps}`);
        failed++;
        continue;
      }

      // Проверка для блока Братья
      if (config.settings.blocks?.brothers?.digits) {
        const brothersSteps = example.steps.filter(s =>
          typeof s === 'object' && s.isBrother
        );
        if (brothersSteps.length === 0) {
          console.log(`  ${i + 1}. ❌ Нет шагов с правилом Братья`);
          failed++;
          continue;
        }
      }

      // Проверка для блока Друзья
      if (config.settings.blocks?.friends?.digits) {
        const friendsSteps = example.steps.filter(s =>
          typeof s === 'object' && s.isFriend
        );
        if (friendsSteps.length === 0) {
          console.log(`  ${i + 1}. ❌ Нет шагов с правилом Друзья`);
          failed++;
          continue;
        }
      }

      success++;

    } catch (error) {
      console.log(`  ${i + 1}. ❌ Ошибка: ${error.message}`);
      failed++;
    }
  }

  totalTests += examplesCount;
  totalSuccess += success;
  totalFailed += failed;

  const successRate = ((success / examplesCount) * 100).toFixed(1);
  if (success === examplesCount) {
    console.log(`\n✅ Результат: ${success}/${examplesCount} (${successRate}%) - ВСЕ УСПЕШНО`);
  } else {
    console.log(`\n❌ Результат: ${success}/${examplesCount} (${successRate}%) - ЕСТЬ ПРОБЛЕМЫ`);
  }
}

// Итоговый отчет
console.log(`\n${'='.repeat(70)}`);
console.log('📊 ИТОГОВЫЙ ОТЧЕТ');
console.log('='.repeat(70));
console.log(`Всего тестов: ${totalTests}`);
console.log(`Успешно: ${totalSuccess} (${((totalSuccess / totalTests) * 100).toFixed(1)}%)`);
console.log(`Провалено: ${totalFailed} (${((totalFailed / totalTests) * 100).toFixed(1)}%)`);

if (totalFailed === 0) {
  console.log('\n🎉 ВСЕ БЛОКИ РАБОТАЮТ ОТЛИЧНО!');
  process.exit(0);
} else {
  console.log('\n⚠️ ТРЕБУЕТСЯ ДОРАБОТКА!');
  process.exit(1);
}
