/**
 * Тест крайних случаев для печати
 */

import { generateExample } from './ext/core/generator.js';

console.log('🧪 ТЕСТ: Крайние случаи для печати');
console.log('='.repeat(70));

const edgeCases = [
  {
    name: 'Просто: только цифра 1, 20 шагов',
    settings: {
      digits: 1,
      actions: { count: 20 },
      blocks: {
        simple: {
          digits: [1],
          includeFive: false
        }
      }
    }
  },
  {
    name: 'Просто: только цифра 9, 15 шагов',
    settings: {
      digits: 1,
      actions: { count: 15 },
      blocks: {
        simple: {
          digits: [9],
          includeFive: true
        }
      }
    }
  },
  {
    name: 'Просто: минимум 2 шага',
    settings: {
      digits: 1,
      actions: { count: 2 },
      blocks: {
        simple: {
          digits: [1, 2, 3, 4, 5, 6, 7, 8, 9],
          includeFive: true
        }
      }
    }
  },
  {
    name: 'Братья: цифра 1, 15 шагов',
    settings: {
      digits: 1,
      actions: { count: 15 },
      blocks: {
        simple: {
          digits: [1, 2, 3, 4, 5, 6, 7, 8, 9],
          includeFive: true
        },
        brothers: {
          digits: [1]
        }
      }
    }
  },
  {
    name: 'Братья: все цифры [1,2,3,4], 12 шагов',
    settings: {
      digits: 1,
      actions: { count: 12 },
      blocks: {
        simple: {
          digits: [1, 2, 3, 4, 5, 6, 7, 8, 9],
          includeFive: true
        },
        brothers: {
          digits: [1, 2, 3, 4]
        }
      }
    }
  },
  {
    name: 'Друзья: только цифра 1, 15 шагов',
    settings: {
      digits: 2,
      actions: { count: 15 },
      blocks: {
        simple: {
          digits: [1, 2, 3, 4, 5, 6, 7, 8, 9]
        },
        friends: {
          digits: [1]
        }
      }
    }
  },
  {
    name: 'Друзья: только цифра 9, 15 шагов',
    settings: {
      digits: 2,
      actions: { count: 15 },
      blocks: {
        simple: {
          digits: [1, 2, 3, 4, 5, 6, 7, 8, 9]
        },
        friends: {
          digits: [9]
        }
      }
    }
  },
  {
    name: 'Друзья: все цифры [1-9], 20 шагов',
    settings: {
      digits: 2,
      actions: { count: 20 },
      blocks: {
        simple: {
          digits: [1, 2, 3, 4, 5, 6, 7, 8, 9]
        },
        friends: {
          digits: [1, 2, 3, 4, 5, 6, 7, 8, 9]
        }
      }
    }
  },
  {
    name: 'Друзья: минимум 3 шага',
    settings: {
      digits: 2,
      actions: { count: 3 },
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
    name: 'Просто: ограниченные цифры [2, 5, 8], 10 шагов',
    settings: {
      digits: 1,
      actions: { count: 10 },
      blocks: {
        simple: {
          digits: [2, 5, 8],
          includeFive: true
        }
      }
    }
  }
];

let totalTests = 0;
let totalSuccess = 0;
let totalFailed = 0;
const failedCases = [];

for (const testCase of edgeCases) {
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`📋 ${testCase.name}`);
  console.log('─'.repeat(70));

  let success = 0;
  let failed = 0;
  const examplesCount = 5; // Меньше примеров для крайних случаев

  for (let i = 0; i < examplesCount; i++) {
    try {
      const example = generateExample(testCase.settings);

      if (!example || !example.steps || !Array.isArray(example.steps)) {
        console.log(`  ${i + 1}. ❌ Пустой результат`);
        failed++;
        continue;
      }

      const expectedSteps = testCase.settings.actions.count;
      const actualSteps = example.steps.length;

      if (actualSteps !== expectedSteps) {
        console.log(`  ${i + 1}. ❌ Шагов: ${actualSteps}/${expectedSteps}`);
        failed++;
        continue;
      }

      // Проверка для блока Братья
      if (testCase.settings.blocks?.brothers?.digits) {
        const brothersSteps = example.steps.filter(s =>
          typeof s === 'object' && s.isBrother
        );
        if (brothersSteps.length === 0) {
          console.log(`  ${i + 1}. ❌ Нет Братья`);
          failed++;
          continue;
        }
      }

      // Проверка для блока Друзья
      if (testCase.settings.blocks?.friends?.digits) {
        const friendsSteps = example.steps.filter(s =>
          typeof s === 'object' && s.isFriend
        );
        if (friendsSteps.length === 0) {
          console.log(`  ${i + 1}. ❌ Нет Друзья`);
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
    console.log(`✅ ${success}/${examplesCount} (${successRate}%)`);
  } else {
    console.log(`❌ ${success}/${examplesCount} (${successRate}%)`);
    failedCases.push(testCase.name);
  }
}

// Итоговый отчет
console.log(`\n${'='.repeat(70)}`);
console.log('📊 ИТОГОВЫЙ ОТЧЕТ');
console.log('='.repeat(70));
console.log(`Всего тестов: ${totalTests}`);
console.log(`Успешно: ${totalSuccess} (${((totalSuccess / totalTests) * 100).toFixed(1)}%)`);
console.log(`Провалено: ${totalFailed} (${((totalFailed / totalTests) * 100).toFixed(1)}%)`);

if (failedCases.length > 0) {
  console.log('\n⚠️ Провальные тесты:');
  failedCases.forEach((name, idx) => {
    console.log(`  ${idx + 1}. ${name}`);
  });
}

if (totalFailed === 0) {
  console.log('\n🎉 ВСЕ КРАЙНИЕ СЛУЧАИ ОБРАБОТАНЫ!');
  process.exit(0);
} else {
  console.log('\n⚠️ ЕСТЬ ПРОБЛЕМЫ С КРАЙНИМИ СЛУЧАЯМИ');
  process.exit(1);
}
