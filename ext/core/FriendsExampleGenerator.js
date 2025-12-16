// ext/core/FriendsExampleGenerator.js - Специализированный генератор для правила "Друзья"
//
// ПРАВИЛО "ДРУЗЬЯ" (через 10):
// Применяется когда невозможно выполнить +n или -n напрямую на текущем разряде.
// Действие выполняется через следующий разряд (десяток).
//
// ФОРМУЛЫ:
//   СЛОЖЕНИЕ:  +n = +10 - friend,  где friend = 10 - n
//   ВЫЧИТАНИЕ: -n = -10 + friend,  где friend = 10 - n
//
// ТРЕБОВАНИЯ ДЛЯ КАЖДОЙ ЦИФРЫ (согласно ТЗ):
//   +1: первый разряд 9
//   +2: первый разряд 8-9
//   +3: первый разряд 7-9
//   +4: первый разряд 6-9
//   +5: первый разряд 5-9
//   +6: первый разряд 4-9
//   +7: первый разряд 3-9
//   +8: первый разряд 2-9
//   +9: первый разряд 1-9
//
//   -1: первый разряд 0
//   -2: первый разряд 0-1
//   -3: первый разряд 0-2
//   -4: первый разряд 0-3
//   -5: первый разряд 0-4
//   -6: первый разряд 0-3
//   -7: первый разряд 0-2
//   -8: первый разряд 0-1
//   -9: первый разряд 0

export class FriendsExampleGenerator {
  constructor(config = {}) {
    // Конфигурация генератора
    this.config = {
      // Какие цифры "друзья" тренируем: [1..9]
      selectedDigits: Array.isArray(config.selectedDigits)
        ? config.selectedDigits.map(n => parseInt(n, 10)).filter(n => n >= 1 && n <= 9)
        : [1, 2, 3, 4, 5, 6, 7, 8, 9],

      // Разрядность (минимум 2 для правила Друзья)
      digitCount: Math.max(2, config.digitCount || 2),

      // Диапазон количества шагов
      minSteps: config.minSteps || 3,
      maxSteps: config.maxSteps || 7,

      // Ограничения направления
      onlyAddition: config.onlyAddition || false,
      onlySubtraction: config.onlySubtraction || false,

      // Какие цифры разрешены для простых (вспомогательных) действий
      simpleDigits: config.blocks?.simple?.digits
        ? config.blocks.simple.digits.map(n => parseInt(n, 10)).filter(n => n >= 1 && n <= 9)
        : [1, 2, 3, 4, 5, 6, 7, 8, 9],

      // Активен ли блок "Братья" (влияет на использование верхней бусины)
      brothersActive: config.blocks?.brothers?.active || false,

      // Исходная конфигурация
      blocks: config.blocks || {}
    };

    // Валидация
    if (this.config.selectedDigits.length === 0) {
      console.warn("⚠️ FriendsExampleGenerator: не выбрано ни одной цифры! Используем [1]");
      this.config.selectedDigits = [1];
    }

    if (this.config.digitCount < 2) {
      console.warn("⚠️ FriendsExampleGenerator: правило Друзья требует минимум 2 разряда! Устанавливаем 2");
      this.config.digitCount = 2;
    }

    console.log(`🤝 FriendsExampleGenerator создан:
  Выбранные цифры Друзья: [${this.config.selectedDigits.join(', ')}]
  Простые цифры: [${this.config.simpleDigits.join(', ')}]
  Разрядность: ${this.config.digitCount}
  Шаги: ${this.config.minSteps}-${this.config.maxSteps}
  Братья активны: ${this.config.brothersActive} (верхняя бусина ${this.config.brothersActive ? 'разрешена' : 'запрещена'})`);
  }

  // ========== СЕКЦИЯ 1: ФИЗИКА АБАКУСА ==========

  /**
   * Получить состояние верхней бусины (0 или 1)
   * @param {number} v - значение разряда (0-9)
   */
  _U(v) {
    return v >= 5 ? 1 : 0;
  }

  /**
   * Получить количество активных нижних бусин (0-4)
   * @param {number} v - значение разряда (0-9)
   */
  _L(v) {
    return v >= 5 ? v - 5 : v;
  }

  /**
   * Собрать значение из верхней и нижних бусин
   * @param {number} U - верхняя бусина (0 или 1)
   * @param {number} L - нижние бусины (0-4)
   */
  _toValue(U, L) {
    return 5 * U + L;
  }

  /**
   * Можно ли выполнить +n НАПРЯМУЮ на одной стойке?
   * Это одно движение вверх: добавляем бусины без убирания.
   *
   * ВАЖНО: Если блок "Братья" НЕ активен → НЕЛЬЗЯ использовать верхнюю бусину!
   *
   * @param {number} v - текущее значение разряда (0-9)
   * @param {number} n - сколько добавить (1-9)
   * @returns {boolean}
   */
  _canPlusDirect(v, n) {
    if (n < 1 || n > 9) return false;

    const targetV = v + n;
    if (targetV > 9) return false; // выход за пределы

    const U1 = this._U(v);
    const L1 = this._L(v);
    const U2 = this._U(targetV);
    const L2 = this._L(targetV);

    // КРИТИЧНО: Если Братья НЕ активны → верхняя бусина НЕ может меняться!
    // Разрешены ТОЛЬКО действия с нижними бусинами (0→4)
    if (!this.config.brothersActive && U2 !== U1) {
      return false; // ❌ Нельзя трогать верхнюю бусину (пятёрку)
    }

    // Жест вверх: можно только ДОБАВЛЯТЬ бусины
    // Верхняя: U2 >= U1 (либо осталась, либо добавили)
    // Нижние: L2 >= L1 (либо остались, либо добавили)
    const topChange = U2 - U1;  // 0 или +1
    const botChange = L2 - L1;  // 0..+4

    // Нельзя убирать ничего в жесте "вверх"
    if (topChange < 0 || botChange < 0) return false;

    // Должно быть хоть какое-то изменение
    if (topChange === 0 && botChange === 0) return false;

    return true;
  }

  /**
   * Можно ли выполнить -n НАПРЯМУЮ на одной стойке?
   * Это одно движение вниз: убираем бусины без добавления.
   *
   * ВАЖНО: Если блок "Братья" НЕ активен → НЕЛЬЗЯ использовать верхнюю бусину!
   *
   * @param {number} v - текущее значение разряда (0-9)
   * @param {number} n - сколько отнять (1-9)
   * @returns {boolean}
   */
  _canMinusDirect(v, n) {
    if (n < 1 || n > 9) return false;

    const targetV = v - n;
    if (targetV < 0) return false; // уход в минус

    const U1 = this._U(v);
    const L1 = this._L(v);
    const U2 = this._U(targetV);
    const L2 = this._L(targetV);

    // КРИТИЧНО: Если Братья НЕ активны → верхняя бусина НЕ может меняться!
    if (!this.config.brothersActive && U2 !== U1) {
      return false; // ❌ Нельзя трогать верхнюю бусину (пятёрку)
    }

    // Жест вниз: можно только УБИРАТЬ бусины
    // Верхняя: U2 <= U1 (либо осталась, либо убрали)
    // Нижние: L2 <= L1 (либо остались, либо убрали)
    const topChange = U2 - U1;  // 0 или -1
    const botChange = L2 - L1;  // -4..0

    // Нельзя добавлять ничего в жесте "вниз"
    if (topChange > 0 || botChange > 0) return false;

    // Должно быть хоть какое-то изменение
    if (topChange === 0 && botChange === 0) return false;

    return true;
  }

  /**
   * Можно ли добавить +10 (перенос в следующий разряд)?
   * @param {number[]} states - состояние всех разрядов
   * @param {number} position - индекс текущего разряда
   * @returns {boolean}
   */
  _canAddTen(states, position) {
    // Нужен следующий разряд
    if (position + 1 >= states.length) {
      return false;
    }

    const nextVal = states[position + 1];

    // Главное условие: есть ли свободные бусины?
    // Можно добавить 1, если разряд < 9
    return nextVal < 9;
  }

  /**
   * Можно ли убрать -10 (заём из следующего разряда)?
   * @param {number[]} states - состояние всех разрядов
   * @param {number} position - индекс текущего разряда
   * @returns {boolean}
   */
  _canSubtractTen(states, position) {
    // Нужен следующий разряд
    if (position + 1 >= states.length) {
      return false;
    }

    const nextVal = states[position + 1];

    // Главное условие: есть ли активные бусины?
    return nextVal > 0;
  }

  // ========== СЕКЦИЯ 2: ТАБЛИЦЫ ТРЕБОВАНИЙ ДЛЯ КАЖДОЙ ЦИФРЫ ==========

  /**
   * Получить требования к состоянию для применения +digit по правилу Друзья
   *
   * Возвращает: { minState, maxState, states: [...] }
   *
   * Примеры:
   *   +1: нужно 9 (все бусины активны)
   *   +2: нужно 8 или 9
   *   +5: нужно 5-9 (верхняя бусина активна)
   */
  _getAdditionRequirements(digit) {
    const friend = 10 - digit;

    switch(digit) {
      case 1:
        return { minState: 9, maxState: 9, states: [9] };
      case 2:
        return { minState: 8, maxState: 9, states: [8, 9] };
      case 3:
        return { minState: 7, maxState: 9, states: [7, 8, 9] };
      case 4:
        return { minState: 6, maxState: 9, states: [6, 7, 8, 9] };
      case 5:
        return { minState: 5, maxState: 9, states: [5, 6, 7, 8, 9] };
      case 6:
        return { minState: 4, maxState: 9, states: [4, 5, 6, 7, 8, 9] };
      case 7:
        return { minState: 3, maxState: 9, states: [3, 4, 5, 6, 7, 8, 9] };
      case 8:
        return { minState: 2, maxState: 9, states: [2, 3, 4, 5, 6, 7, 8, 9] };
      case 9:
        return { minState: 1, maxState: 9, states: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
      default:
        return { minState: friend, maxState: 9, states: [] };
    }
  }

  /**
   * Получить требования к состоянию для применения -digit по правилу Друзья
   *
   * Возвращает: { minState, maxState, states: [...] }
   *
   * Примеры:
   *   -1: нужно 0 (нет активных бусин)
   *   -2: нужно 0 или 1
   *   -5: нужно 0-4 (верхняя НЕ активна)
   */
  _getSubtractionRequirements(digit) {
    const friend = 10 - digit;
    const maxAllowed = 9 - friend;

    switch(digit) {
      case 1:
        return { minState: 0, maxState: 0, states: [0] };
      case 2:
        return { minState: 0, maxState: 1, states: [0, 1] };
      case 3:
        return { minState: 0, maxState: 2, states: [0, 1, 2] };
      case 4:
        return { minState: 0, maxState: 3, states: [0, 1, 2, 3] };
      case 5:
        return { minState: 0, maxState: 4, states: [0, 1, 2, 3, 4] };
      case 6:
        return { minState: 0, maxState: 3, states: [0, 1, 2, 3] };
      case 7:
        return { minState: 0, maxState: 2, states: [0, 1, 2] };
      case 8:
        return { minState: 0, maxState: 1, states: [0, 1] };
      case 9:
        return { minState: 0, maxState: 0, states: [0] };
      default:
        return { minState: 0, maxState: maxAllowed, states: [] };
    }
  }

  // ========== СЕКЦИЯ 3: ГЕНЕРАЦИЯ ПРИМЕРОВ ==========

  /**
   * Главный метод: сгенерировать пример
   */
  generate() {
    const maxAttempts = 100;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const example = this._generateAttempt();

      if (!example) {
        if (attempt % 30 === 0) {
          console.warn(`⚠️ Попытка ${attempt}: не удалось сгенерировать пример`);
        }
        continue;
      }

      if (!this._validateExample(example)) {
        if (attempt % 30 === 0) {
          console.warn(`⚠️ Попытка ${attempt}: пример не прошёл валидацию`);
        }
        continue;
      }

      console.log(`✅ Пример сгенерирован за ${attempt} попыток: ${this._formatForDisplay(example)}`);
      return example;
    }

    console.error(`❌ Не удалось сгенерировать пример за ${maxAttempts} попыток!`);
    return this._fallbackExample();
  }

  /**
   * Генерация одной попытки примера
   */
  _generateAttempt() {
    // Инициализация
    let states = Array(this.config.digitCount).fill(0);
    const steps = [];
    const stepsCount = this.config.minSteps +
      Math.floor(Math.random() * (this.config.maxSteps - this.config.minSteps + 1));

    let friendStepsCount = 0;
    let attempts = 0;
    const maxAttempts = 1000;

    // Целевое количество Friends действий (минимум 1, лучше 30-50% от общего)
    const minFriendSteps = 1;
    const targetFriendSteps = Math.max(1, Math.floor(stepsCount * 0.4));

    console.log(`🎯 Генерация Friends примера: ${stepsCount} шагов, цель ${targetFriendSteps} Friends`);

    while (steps.length < stepsCount && attempts < maxAttempts) {
      attempts++;
      const isFirst = steps.length === 0;
      const stepsRemaining = stepsCount - steps.length;

      // Решаем: пытаться ли сгенерировать Friends действие
      const needMoreFriends = friendStepsCount < minFriendSteps;
      const wantMoreFriends = friendStepsCount < targetFriendSteps;
      const tryFriend = needMoreFriends || (wantMoreFriends && stepsRemaining >= 2 && Math.random() < 0.6);

      if (tryFriend) {
        // Планируем последовательность действий для Friends
        const plannedActions = this._planFriendSequence(states, isFirst, stepsRemaining);

        if (plannedActions && plannedActions.length > 0) {
          // Применяем все запланированные шаги
          let allSuccessful = true;
          const appliedSteps = [];
          let currentStates = states;

          for (const action of plannedActions) {
            const newStates = this._applyAction(currentStates, action);

            if (!newStates || !this._isValidState(newStates) || this._checkOverflow(newStates)) {
              allSuccessful = false;
              break;
            }

            appliedSteps.push({
              action: action.value,
              isFriend: action.isFriend,
              friendN: action.isFriend ? Math.abs(action.value) : undefined,
              formula: action.isFriend ? this._buildFormula(action.value) : undefined,
              states: [...newStates]
            });

            currentStates = newStates;
          }

          if (allSuccessful && appliedSteps.length > 0) {
            // Все шаги применены успешно
            for (const step of appliedSteps) {
              steps.push(step);

              if (step.isFriend) {
                friendStepsCount++;
              }
            }

            states = currentStates;
            continue; // Переходим к следующей итерации
          }
        }
      }

      // Если Friends не получилось или не пытались, используем Simple действие
      const action = this._generateSimpleAction(states, isFirst);

      if (!action) {
        continue; // Ничего не подошло, пробуем ещё раз
      }

      // Применяем действие
      const newStates = this._applyAction(states, action);

      if (!newStates || !this._isValidState(newStates) || this._checkOverflow(newStates)) {
        continue;
      }

      steps.push({
        action: action.value,
        isFriend: false,
        states: [...newStates]
      });

      states = newStates;
    }

    // Проверка: есть ли хотя бы 1 Friends действие?
    if (friendStepsCount === 0) {
      return null; // Попытка провалилась
    }

    if (steps.length < this.config.minSteps) {
      return null; // Слишком мало шагов
    }

    return {
      start: Array(this.config.digitCount).fill(0),
      steps,
      answer: [...states]
    };
  }

  /**
   * Построить формулу для Friends действия
   * @param {number} value - значение действия (+1, -2, и т.д.)
   */
  _buildFormula(value) {
    const friend = 10 - Math.abs(value);

    if (value > 0) {
      // +n = +10 - friend
      return [
        { op: '+', val: 10 },
        { op: '-', val: friend }
      ];
    } else {
      // -n = -10 + friend
      return [
        { op: '-', val: 10 },
        { op: '+', val: friend }
      ];
    }
  }

  /**
   * Валидация примера
   */
  _validateExample(example) {
    const { start, steps, answer } = example;

    // 1. Проверка наличия шагов
    if (!steps || steps.length < this.config.minSteps || steps.length > this.config.maxSteps) {
      return false;
    }

    // 2. Проверка наличия Friends шагов (ОБЯЗАТЕЛЬНО!)
    const friendSteps = steps.filter(s => s.isFriend);
    if (friendSteps.length < 1) {
      return false;
    }

    // 3. Проверка что используемые цифры входят в selectedDigits
    const allowedDigits = new Set(this.config.selectedDigits);
    for (const step of friendSteps) {
      if (step.friendN && !allowedDigits.has(step.friendN)) {
        return false;
      }
    }

    // 4. Валидность всех промежуточных состояний
    for (const step of steps) {
      if (!this._isValidState(step.states)) {
        return false;
      }

      // Проверка переполнения
      if (this._checkOverflow(step.states)) {
        return false;
      }
    }

    // 5. Корректность финального ответа
    const finalStates = steps[steps.length - 1].states;
    if (!this._arraysEqual(finalStates, answer)) {
      return false;
    }

    return true;
  }

  /**
   * Минимальный fallback-пример если генерация не удалась
   */
  _fallbackExample() {
    // Простейший пример: 0 +9 → 9 +1 → 10 (через Friends)
    return {
      start: Array(this.config.digitCount).fill(0),
      steps: [
        {
          action: 9,
          isFriend: false,
          states: [9, 0]
        },
        {
          action: 1,
          isFriend: true,
          friendN: 1,
          formula: [{ op: '+', val: 10 }, { op: '-', val: 9 }],
          states: [0, 1]
        }
      ],
      answer: [0, 1]
    };
  }

  // ========== СЕКЦИЯ 4: ПЛАНИРОВАНИЕ FRIENDS ДЕЙСТВИЙ ==========

  /**
   * Спланировать последовательность действий для применения одного Friends действия
   *
   * Возвращает: [{value, isFriend}, ...] или null
   */
  _planFriendSequence(states, isFirst, stepsRemaining) {
    const { selectedDigits, onlyAddition, onlySubtraction } = this.config;

    // Перемешиваем цифры для случайного выбора
    const shuffled = [...selectedDigits].sort(() => Math.random() - 0.5);

    for (const digit of shuffled) {
      // Пробуем +digit (добавление)
      if (!onlySubtraction && (isFirst || digit > 0)) {
        const plan = this._planAddition(digit, states, isFirst, stepsRemaining);
        if (plan && plan.length > 0) {
          return plan;
        }
      }

      // Пробуем -digit (вычитание)
      if (!onlyAddition && !isFirst) {
        const plan = this._planSubtraction(digit, states, stepsRemaining);
        if (plan && plan.length > 0) {
          return plan;
        }
      }
    }

    return null;
  }

  /**
   * Спланировать +digit по правилу Друзья
   *
   * Формула: +digit = +10 - friend, где friend = 10 - digit
   */
  _planAddition(digit, states, isFirst, stepsRemaining) {
    const position = 0; // Работаем с первым разрядом (единицы)
    const currentValue = states[position];

    // Получаем требования для этой цифры
    const requirements = this._getAdditionRequirements(digit);

    // Проверяем физическую возможность +10
    if (!this._canAddTen(states, position)) {
      return null; // Нет места в следующем разряде
    }

    // Проверяем, можем ли применить Friends СЕЙЧАС
    if (requirements.states.includes(currentValue)) {
      const friend = 10 - digit;

      // Дополнительная проверка: можем ли вычесть friend?
      if (this._canMinusDirect(currentValue, friend)) {
        // Можем применить сразу!
        return [{ value: digit, isFriend: true }];
      }
    }

    // Не можем применить сейчас - нужна подготовка
    const targetValue = requirements.minState;
    const needToAdd = targetValue - currentValue;

    if (needToAdd <= 0) {
      return null; // Что-то не так
    }

    // Проверяем, хватает ли места для подготовки
    if (stepsRemaining < 2) {
      return null; // Недостаточно шагов
    }

    const maxCanAdd = 9 - currentValue;
    if (needToAdd > maxCanAdd) {
      return null; // Не можем подготовить
    }

    // Попытка прямой подготовки (за 1 шаг)
    if (this._canPlusDirect(currentValue, needToAdd)) {
      return [
        { value: needToAdd, isFriend: false },  // подготовка
        { value: digit, isFriend: true }         // Friends
      ];
    }

    // Попытка многошаговой подготовки
    const preparationSteps = this._generatePreparationSteps(
      currentValue,
      targetValue,
      stepsRemaining - 1,
      isFirst
    );

    if (preparationSteps && preparationSteps.length > 0) {
      return [
        ...preparationSteps,              // несколько шагов подготовки
        { value: digit, isFriend: true }  // Friends
      ];
    }

    return null;
  }

  /**
   * Спланировать -digit по правилу Друзья
   *
   * Формула: -digit = -10 + friend, где friend = 10 - digit
   */
  _planSubtraction(digit, states, stepsRemaining) {
    const position = 0;
    const currentValue = states[position];

    // Получаем требования для этой цифры
    const requirements = this._getSubtractionRequirements(digit);

    // Проверяем физическую возможность -10
    if (!this._canSubtractTen(states, position)) {
      return null; // Нечего занимать из следующего разряда
    }

    // Проверяем, можем ли применить Friends СЕЙЧАС
    if (requirements.states.includes(currentValue)) {
      const friend = 10 - digit;

      // Дополнительная проверка: можем ли добавить friend?
      if (this._canPlusDirect(currentValue, friend)) {
        // Можем применить сразу!
        return [{ value: -digit, isFriend: true }];
      }
    }

    // Не можем применить сейчас - нужна подготовка
    const targetValue = requirements.maxState;
    const needToSubtract = currentValue - targetValue;

    if (needToSubtract <= 0) {
      return null; // Что-то не так
    }

    // Проверяем, хватает ли места для подготовки
    if (stepsRemaining < 2) {
      return null;
    }

    // Проверяем физическую возможность подготовки
    if (!this._canMinusDirect(currentValue, needToSubtract)) {
      return null; // Не можем подготовить напрямую
    }

    return [
      { value: -needToSubtract, isFriend: false },  // подготовка
      { value: -digit, isFriend: true }              // Friends
    ];
  }

  /**
   * Генерация нескольких подготовительных шагов для достижения целевого состояния
   *
   * Используется когда за одно действие не получается достичь нужного состояния
   */
  _generatePreparationSteps(currentValue, targetValue, maxSteps, isFirst) {
    if (maxSteps < 1) return null;

    const diff = targetValue - currentValue;
    if (diff === 0) return [];

    const steps = [];
    let value = currentValue;
    const simpleDigits = [...this.config.simpleDigits].sort((a, b) => b - a); // По убыванию

    let remaining = diff;

    while (remaining > 0 && steps.length < maxSteps) {
      // Выбираем максимально возможное действие из доступных
      let bestAction = null;

      for (const digit of simpleDigits) {
        if (digit <= remaining && this._canPlusDirect(value, digit)) {
          bestAction = digit;
          break;
        }
      }

      if (!bestAction) break;

      steps.push({ value: bestAction, isFriend: false });
      value += bestAction;
      remaining -= bestAction;
    }

    // Проверяем, достигли ли цели
    if (remaining === 0) {
      return steps;
    }

    return null; // Не удалось подготовить
  }

  // ========== СЕКЦИЯ 5: ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ==========

  /**
   * Сгенерировать простое (не-Friends) действие для разнообразия
   */
  _generateSimpleAction(states, isFirst) {
    const currentValue = states[0];
    const availableActions = [];

    for (const digit of this.config.simpleDigits) {
      // +digit
      if (isFirst || digit > 0) {
        if (this._canPlusDirect(currentValue, digit)) {
          availableActions.push(digit);
        }
      }

      // -digit
      if (!isFirst) {
        if (this._canMinusDirect(currentValue, digit)) {
          availableActions.push(-digit);
        }
      }
    }

    if (availableActions.length === 0) {
      return null;
    }

    const action = availableActions[Math.floor(Math.random() * availableActions.length)];
    return { value: action, isFriend: false };
  }

  /**
   * Применить действие к состоянию абакуса
   *
   * @param {number[]} states - массив разрядов
   * @param {Object} actionObj - {value, isFriend}
   * @returns {number[]} - новое состояние или null
   */
  _applyAction(states, actionObj) {
    const newStates = [...states];
    const value = actionObj.value;
    const isFriend = actionObj.isFriend;

    if (!isFriend) {
      // Простое действие: только первый разряд
      newStates[0] += value;

      if (newStates[0] < 0 || newStates[0] > 9) {
        return null; // Невалидно
      }
    } else {
      // Friends действие: перенос между разрядами
      const friend = 10 - Math.abs(value);
      const isAddition = value > 0;

      if (isAddition) {
        // +n = +10 - friend
        newStates[1] += 1;        // +10 к следующему разряду
        newStates[0] -= friend;   // -friend к текущему разряду
      } else {
        // -n = -10 + friend
        newStates[1] -= 1;        // -10 из следующего разряда
        newStates[0] += friend;   // +friend к текущему разряду
      }

      // Проверка валидности всех разрядов
      for (let i = 0; i < newStates.length; i++) {
        if (newStates[i] < 0 || newStates[i] > 9) {
          return null;
        }
      }
    }

    return newStates;
  }

  /**
   * Проверка валидности состояния
   */
  _isValidState(states) {
    for (let i = 0; i < states.length; i++) {
      if (states[i] < 0 || states[i] > 9) {
        return false;
      }
    }
    return true;
  }

  /**
   * Проверка переполнения разрядности
   */
  _checkOverflow(states) {
    // Проверяем, что все разряды ВЫШЕ digitCount равны 0
    for (let i = this.config.digitCount; i < states.length; i++) {
      if (states[i] !== 0) {
        return true; // Есть переполнение!
      }
    }
    return false;
  }

  /**
   * Преобразовать состояние в число
   */
  stateToNumber(state) {
    if (!Array.isArray(state)) return 0;

    let result = 0;
    for (let i = 0; i < this.config.digitCount && i < state.length; i++) {
      result += state[i] * Math.pow(10, i);
    }

    return result;
  }

  /**
   * Формат для trainer_logic.js
   */
  toTrainerFormat(example) {
    const formattedSteps = [];

    for (const step of example.steps) {
      if (step.isFriend) {
        // Friends шаг - возвращаем объект с формулой
        const value = step.action;
        const sign = value >= 0 ? '+' : '';

        formattedSteps.push({
          step: `${sign}${value}`,
          isFriend: true,
          friendN: step.friendN,
          formula: step.formula
        });
      } else {
        // Простой шаг - возвращаем строку
        const value = step.action;
        const sign = value >= 0 ? '+' : '';
        formattedSteps.push(`${sign}${value}`);
      }
    }

    return {
      start: 0, // Всегда стартуем с 0
      steps: formattedSteps,
      answer: this.stateToNumber(example.answer)
    };
  }

  /**
   * Формат для отладки
   */
  _formatForDisplay(example) {
    const stepsStr = example.steps
      .map(s => {
        const val = s.action;
        const sign = val >= 0 ? '+' : '';
        const mark = s.isFriend ? '🤝' : '';
        return `${sign}${val}${mark}`;
      })
      .join(' ');

    return `${stepsStr} = ${this.stateToNumber(example.answer)}`;
  }

  /**
   * Сравнение двух массивов
   */
  _arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => val === b[idx]);
  }
}
