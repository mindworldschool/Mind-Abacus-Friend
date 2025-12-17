// Тест для проверки обходного пути через 9

import { FriendsExampleGenerator } from './ext/core/FriendsExampleGenerator.js';

console.log('='.repeat(80));
console.log('ТЕСТ ОБХОДНОГО ПУТИ: запуск до тех пор, пока не получим старт +4');
console.log('='.repeat(80));

// Запускаем генератор много раз, пока не попадем на случай со стартом +4
let attempts = 0;
let foundDetour = false;

while (!foundDetour && attempts < 50) {
  attempts++;

  const gen = new FriendsExampleGenerator({
    selectedDigits: [2],  // Цифра 2: требует состояние единиц = 8
    digitCount: 2,
    stepsCount: 7,
    blocks: {
      brothers: {
        active: true
      }
    }
  });

  // Перехватываем console.log для поиска сообщения об обходном пути
  const originalLog = console.log;
  const logs = [];
  console.log = (...args) => {
    logs.push(args.join(' '));
    originalLog(...args);
  };

  const example = gen.generate();
  console.log = originalLog;

  // Проверяем, был ли использован обходной путь
  const hasDetourLog = logs.some(log => log.includes('🔄 Обходной путь'));
  const hasStart4 = logs.some(log => log.includes('🎲 Случайное начало: +4'));

  if (hasStart4 || hasDetourLog) {
    console.log('\n✨ НАШЛИ СЛУЧАЙ С ОБХОДНЫМ ПУТЕМ ИЛИ СТАРТОМ +4!');
    console.log(`Попытка №${attempts}\n`);

    if (example) {
      const formatted = gen.toTrainerFormat(example);
      console.log('Сгенерированный пример:');
      console.log(JSON.stringify(formatted, null, 2));

      const friendSteps = example.steps.filter(s => s.isFriend);
      console.log(`\n📊 Всего шагов: ${example.steps.length}`);
      console.log(`🤝 Шагов Friends: ${friendSteps.length}`);
    }

    foundDetour = true;
  }
}

if (!foundDetour) {
  console.log(`\n❌ За ${attempts} попыток не попали на случай со стартом +4`);
  console.log('Но это нормально - рандом есть рандом!');
}

console.log('\n' + '='.repeat(80));
