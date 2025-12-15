// ext/core/rules/FriendsRule.js - Правило "Друзья (через 10)"
//
// Правило "Друзья" применяется когда НЕВОЗМОЖНО выполнить +n или -n напрямую,
// потому что на текущем разряде не хватает бусин.
// В этом случае действие выполняется через следующий разряд (десяток).
//
// ФОРМУЛЫ:
//   СЛОЖЕНИЕ:  +n = +10 - friend,  где friend = 10 - n
//   ВЫЧИТАНИЕ: -n = -10 + friend,  где friend = 10 - n
//
// ФИЗИКА АБАКУСА:
//   - Состояние разряда v ∈ [0, 9]
//   - v = 5*U + L, где U ∈ {0,1} (верхняя), L ∈ [0,4] (нижние)
//   - +10 = добавить 1 бусину к следующему разряду
//   - -10 = убрать 1 бусину из следующего разряда
//
// КРИТЕРИИ ПРИМЕНЕНИЯ +n ЧЕРЕЗ ДРУЗЕЙ:
//   1. Нельзя выполнить +n напрямую (не хватает неактивных бусин)
//   2. Можно добавить +10 (следующий разряд позволяет)
//   3. Можно вычесть friend из текущего разряда после +10
//
// КРИТЕРИИ ПРИМЕНЕНИЯ -n ЧЕРЕЗ ДРУЗЕЙ:
//   1. Нельзя выполнить -n напрямую (не хватает активных бусин)
//   2. Можно убрать -10 (следующий разряд > 0)
//   3. Можно добавить friend к текущему разряду после -10

import { BaseRule } from "./BaseRule.js";

export class FriendsRule extends BaseRule {
  constructor(config = {}) {
    super(config);

    // Имя правила
    this.name = "Друзья";

    // 🔴 КРИТИЧНО: Какие цифры "друзья" тренируем: [1..9]
    // Это определяет какие действия через правило Друзья будут доступны
    //
    // Примеры:
    // - Если selectedDigits = [1]:
    //   Доступны: +1 = +10-9, -1 = -10+9
    //
    // - Если selectedDigits = [9]:
    //   Доступны: +9 = +10-1, -9 = -10+1
    //
    // - Если selectedDigits = [1,2,3]:
    //   Доступны: +1,+2,+3,-1,-2,-3 через друзей
    //
    // - Если НЕ указано: все цифры 1-9
    const friendsDigits = Array.isArray(config.selectedDigits)
      ? config.selectedDigits
          .map(n => parseInt(n, 10))
          .filter(n => n >= 1 && n <= 9)
      : [9, 8, 7, 6, 5, 4, 3, 2, 1];

    // Важно: должна быть хотя бы одна цифра!
    if (friendsDigits.length === 0) {
      console.warn("⚠️ FriendsRule: не выбрано ни одной цифры! Используем [9]");
      friendsDigits.push(9);
    }

    // Какие цифры разрешены в блоке "Просто" для вспомогательных шагов
    const simpleBlockDigits = config.blocks?.simple?.digits
      ? config.blocks.simple.digits
          .map(n => parseInt(n, 10))
          .filter(n => n >= 1 && n <= 9)
      : [1, 2, 3, 4, 5, 6, 7, 8, 9];

    // 🔴 КРИТИЧНО: Проверяем активность блока "Братья"
    // Если Братья НЕ активны → нельзя использовать верхнюю бусину (пятёрку)!
    const brothersActive = config.blocks?.brothers?.active ?? false;

    this.config = {
      ...this.config,
      name: "Друзья",
      minState: 0,
      maxState: 9,
      minSteps: config.minSteps ?? 3,
      maxSteps: config.maxSteps ?? 7,
      friendsDigits,
      simpleBlockDigits,
      brothersActive, // 🆕 Сохраняем флаг активности Братьев
      onlyAddition: config.onlyAddition ?? false,
      onlySubtraction: config.onlySubtraction ?? false,
      digitCount: config.digitCount ?? 1,
      combineLevels: config.combineLevels ?? false,
      blocks: config.blocks ?? {}
    };

    console.log(
      `🤝 FriendsRule: друзья=[${friendsDigits.join(", ")}], ` +
      `простые=[${simpleBlockDigits.join(", ")}], ` +
      `onlyAdd=${this.config.onlyAddition}, onlySub=${this.config.onlySubtraction}, ` +
      `🎯 Братья активны=${brothersActive} (верхняя бусина ${brothersActive ? 'РАЗРЕШЕНА' : 'ЗАПРЕЩЕНА'})`
    );

    // Строим таблицу дружеских переходов
    this.friendPairs = this._buildFriendPairs(friendsDigits);
  }

  // ===== ФИЗИКА АБАКУСА: БАЗОВЫЕ ФУНКЦИИ =====

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

  // ===== ПРОВЕРКИ ПРЯМЫХ ДЕЙСТВИЙ (БЕЗ ДРУЗЕЙ) =====

  /**
   * Можно ли выполнить +n НАПРЯМУЮ на одной стойке?
   * Это одно движение вверх: добавляем бусины без убирания.
   *
   * 🔴 ВАЖНО: Если блок "Братья" НЕ активен → НЕЛЬЗЯ использовать верхнюю бусину!
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

    // 🔴 КРИТИЧНО: Если Братья НЕ активны → верхняя бусина НЕ может меняться!
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
   * 🔴 ВАЖНО: Если блок "Братья" НЕ активен → НЕЛЬЗЯ использовать верхнюю бусину!
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

    // 🔴 КРИТИЧНО: Если Братья НЕ активны → верхняя бусина НЕ может меняться!
    // Разрешены ТОЛЬКО действия с нижними бусинами (0→4)
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

  // ===== ПРОВЕРКИ ДЛЯ ПЕРЕНОСА ЧЕРЕЗ 10 =====

  /**
   * Можно ли добавить +10 (перенос в следующий разряд)?
   * +10 = добавить 1 к следующему разряду
   *
   * ГЛАВНОЕ УСЛОВИЕ: Наличие свободных бусин!
   * Проверяем только что разряд < 9 (есть куда добавить 1).
   * Неважно КАК добавляется 1 - через нижнюю (3→4) или верхнюю (4→5) бусину.
   *
   * Проверка разрядности (не превышает ли результат displayDigitCount)
   * выполняется на уровне генератора через _checkOverflow().
   *
   * @param {number[]} fullState - состояние всех разрядов [единицы, десятки, ...]
   * @param {number} position - индекс текущего разряда
   * @returns {boolean}
   */
  _canAddTen(fullState, position) {
    // Нужен следующий разряд
    if (position + 1 >= fullState.length) {
      return false;
    }

    const nextVal = fullState[position + 1];

    // Главное условие: есть ли свободные бусины?
    // Можно добавить 1, если разряд < 9
    return nextVal < 9;
  }

  /**
   * Можно ли убрать -10 (заём из следующего разряда)?
   * -10 = убрать 1 из следующего разряда
   *
   * Главное условие: есть ли активные бусины (занятые бусины)?
   * Переход может использовать любые бусины (верхние или нижние).
   *
   * @param {number[]} fullState - состояние всех разрядов
   * @param {number} position - индекс текущего разряда
   * @returns {boolean}
   */
  _canSubtractTen(fullState, position) {
    // Нужен следующий разряд
    if (position + 1 >= fullState.length) {
      return false;
    }

    const nextVal = fullState[position + 1];

    // Главное условие: есть ли активные бусины?
    return nextVal > 0;
  }

  /**
   * Можно ли вычесть friend из текущего разряда ПОСЛЕ +10?
   * 
   * После +10 текущий разряд остаётся тем же (перенос идёт в следующий),
   * но мы должны вычесть friend, чтобы получить итоговое v + n.
   * 
   * Логика: v + n = v + 10 - friend, где friend = 10 - n
   * После "+10" на текущем разряде значение не меняется!
   * Но концептуально мы "добавили 10", и теперь "убираем friend".
   * 
   * Физически: нужно проверить, можно ли убрать friend из v.
   * 
   * @param {number} v - текущее значение разряда
   * @param {number} friend - сколько нужно вычесть (1-9)
   * @returns {boolean}
   */
  _canSubtractFriend(v, friend) {
    // friend = 10 - n
    // После +10 нам нужно сделать -friend на текущем разряде
    // Это ПРЯМОЕ вычитание
    return this._canMinusDirect(v, friend);
  }

  /**
   * Можно ли добавить friend к текущему разряду ПОСЛЕ -10?
   * 
   * После -10 текущий разряд остаётся тем же (заём из следующего),
   * но мы должны добавить friend, чтобы получить итоговое v - n.
   * 
   * Логика: v - n = v - 10 + friend, где friend = 10 - n
   * 
   * @param {number} v - текущее значение разряда
   * @param {number} friend - сколько нужно добавить (1-9)
   * @returns {boolean}
   */
  _canAddFriend(v, friend) {
    // friend = 10 - n
    // После -10 нам нужно сделать +friend на текущем разряде
    // Это ПРЯМОЕ сложение
    return this._canPlusDirect(v, friend);
  }

  // ===== ПРОВЕРКИ ПРИМЕНИМОСТИ ПРАВИЛА "ДРУЗЬЯ" =====

  /**
   * Можно ли применить +n ЧЕРЕЗ ДРУЗЕЙ?
   * 
   * Условия:
   * 1. Нельзя сделать +n напрямую
   * 2. Можно сделать +10 (перенос)
   * 3. Можно сделать -friend (вычесть остаток)
   * 
   * @param {number} v - текущее значение разряда
   * @param {number} n - сколько добавить (1-9)
   * @param {number[]} fullState - состояние всех разрядов
   * @param {number} position - индекс текущего разряда
   * @returns {boolean}
   */
  canApplyPlusFriend(v, n, fullState, position) {
    const friend = 10 - n;
    
    return (
      !this._canPlusDirect(v, n) &&           // нельзя напрямую
      this._canAddTen(fullState, position) && // можно +10
      this._canSubtractFriend(v, friend)      // можно -friend
    );
  }

  /**
   * Можно ли применить -n ЧЕРЕЗ ДРУЗЕЙ?
   * 
   * Условия:
   * 1. Нельзя сделать -n напрямую
   * 2. Можно сделать -10 (заём)
   * 3. Можно сделать +friend (добавить остаток)
   * 
   * @param {number} v - текущее значение разряда
   * @param {number} n - сколько отнять (1-9)
   * @param {number[]} fullState - состояние всех разрядов
   * @param {number} position - индекс текущего разряда
   * @returns {boolean}
   */
  canApplyMinusFriend(v, n, fullState, position) {
    const friend = 10 - n;
    
    return (
      !this._canMinusDirect(v, n) &&               // нельзя напрямую
      this._canSubtractTen(fullState, position) && // можно -10
      this._canAddFriend(v, friend)                // можно +friend
    );
  }

  // ===== ПОСТРОЕНИЕ ТАБЛИЦЫ ДРУЖЕСКИХ ПЕРЕХОДОВ =====

  /**
   * Создание таблицы дружеских пар для быстрой проверки.
   * Для каждого выбранного n строим возможные переходы через 10.
   * 
   * @param {number[]} digits - выбранные цифры [1-9]
   * @returns {Set<string>} - множество ключей вида "v-vNext-friend{n}"
   */
  _buildFriendPairs(digits) {
    const pairs = new Set();

    for (const n of digits) {
      const friend = 10 - n;

      // === СЛОЖЕНИЕ: v → v+n через +10-friend ===
      for (let v = 0; v <= 9; v++) {
        const vNext = v + n;
        
        // Результат должен быть валидным (0-9)
        // НО! При переходе через друзей v + n может быть > 9,
        // потому что мы делаем перенос в следующий разряд.
        // Итоговое значение ТЕКУЩЕГО разряда = (v + n) % 10
        
        if (vNext > 9) {
          // Это как раз случай для друзей!
          // v + n > 9, значит нужен перенос
          const resultInCurrentDigit = vNext - 10; // что останется после переноса
          
          if (resultInCurrentDigit >= 0 && resultInCurrentDigit <= 9) {
            // Проверяем физическую возможность:
            // 1. Нельзя +n напрямую (да, v+n > 9)
            // 2. Можно -friend (friend = 10 - n, проверяем v >= friend)
            if (!this._canPlusDirect(v, n) && this._canMinusDirect(v, friend)) {
              pairs.add(`${v}-${resultInCurrentDigit}-friend${n}-plus`);
            }
          }
        }
      }

      // === ВЫЧИТАНИЕ: v → v-n через -10+friend ===
      for (let v = 0; v <= 9; v++) {
        const vNext = v - n;
        
        if (vNext < 0) {
          // Это как раз случай для друзей!
          // v - n < 0, значит нужен заём
          const resultInCurrentDigit = vNext + 10; // что станет после заёма
          
          if (resultInCurrentDigit >= 0 && resultInCurrentDigit <= 9) {
            // Проверяем физическую возможность:
            // 1. Нельзя -n напрямую (да, v-n < 0)
            // 2. Можно +friend (проверяем v + friend <= 9)
            if (!this._canMinusDirect(v, n) && this._canPlusDirect(v, friend)) {
              pairs.add(`${v}-${resultInCurrentDigit}-friend${n}-minus`);
            }
          }
        }
      }
    }

    console.log(`📊 Создано ${pairs.size} дружеских переходов`);
    return pairs;
  }

  // ===== ОСНОВНЫЕ МЕТОДЫ ПРАВИЛА =====

  /**
   * Начальное состояние
   */
  generateStartState() {
    return 0;
  }

  /**
   * Случайная длина цепочки
   */
  generateStepsCount() {
    const min = this.config.minSteps;
    const max = this.config.maxSteps;
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  /**
   * Проверка валидности состояния
   *
   * ВАЖНО: Для правила Друзья число может быть > 9 в однозначном режиме!
   * Например: 7+9=16, где 16 = [6, 1] (6 единиц + 1 десяток)
   */
  isValidState(v) {
    // Для массива (многозначный режим)
    if (Array.isArray(v)) {
      return v.every(digit => digit >= this.config.minState && digit <= this.config.maxState);
    }

    // Для числа (однозначный режим)
    // Разрешаем любое неотрицательное число для правила Друзья
    // т.к. перенос в следующий разряд даёт числа > 9
    return v >= this.config.minState;
  }

  /**
   * Получить значение конкретного разряда из состояния
   * @param {number|number[]} state - состояние (число или массив)
   * @param {number} position - позиция разряда
   */
  getDigitValue(state, position) {
    if (Array.isArray(state)) {
      return state[position] ?? 0;
    }
    return state;
  }

  /**
   * Возвращаем доступные действия: И дружеские, И простые шаги.
   * 
   * ЛОГИКА:
   * - Дружеские шаги: когда нельзя выполнить действие напрямую
   * - Простые шаги: прямые действия без переноса (вспомогательные)
   * 
   * @param {number} currentState - текущее значение разряда (0-9)
   * @param {boolean} isFirstAction - это первый шаг?
   * @param {number} position - индекс разряда (0=единицы, 1=десятки...)
   * @param {number[]} fullState - полное состояние абакуса (опционально)
   * @param {Array} previousSteps - история шагов для избежания повторов
   */
  getAvailableActions(currentState, isFirstAction = false, position = 0, fullState = null, previousSteps = []) {
    const {
      onlyAddition,
      onlySubtraction,
      friendsDigits,
      simpleBlockDigits
    } = this.config;

    // 🔴 КРИТИЧНО: Преобразуем число в массив разрядов если нужно
    // Если currentState - это ЧИСЛО (например 34), а не разряд [0-9],
    // значит мы в однозначном режиме и нужно преобразовать в массив
    let v = currentState;
    let state = fullState;

    if (typeof currentState === 'number' && currentState > 9) {
      // Это ЦЕЛОЕ ЧИСЛО, а не разряд! Преобразуем в массив разрядов
      const digits = [];
      let num = Math.abs(currentState);
      for (let i = 0; i < 10; i++) {
        digits.push(num % 10);
        num = Math.floor(num / 10);
        if (num === 0 && i >= 1) break;
      }
      state = digits;
      v = digits[position] || 0; // Значение текущего разряда

      console.log(`🔄 Преобразовали число ${currentState} → массив [${digits.join(', ')}], разряд ${position} = ${v}`);
    } else if (!state) {
      // fullState не передан, создаём минимальный массив
      // Для разряда 0-9 создаём массив где текущая позиция = v
      v = currentState;
      state = Array(10).fill(0);
      state[position] = v;
    }

    const friendActions = [];
    const simpleActions = [];

    // === АНАЛИЗ ПРЕДЫДУЩИХ ШАГОВ ДЛЯ ИЗБЕЖАНИЯ ПОВТОРОВ ===
    const getStepValue = (step) => {
      if (!step) return null;
      const action = step.action ?? step;
      if (typeof action === "object") {
        return action.value;
      }
      return action;
    };

    const lastValue = getStepValue(previousSteps[previousSteps.length - 1]);
    const prevValue = getStepValue(previousSteps[previousSteps.length - 2]);

    const canUseNumber = (num) => {
      if (previousSteps.length === 0) return true;
      
      // Не повторяем точно то же действие подряд
      if (lastValue === num) return false;
      
      // Не делаем +N сразу после -N (и наоборот)
      if (lastValue === -num) return false;
      
      // Не повторяем одно абсолютное число 3 раза подряд
      if (prevValue !== null) {
        const absLast = Math.abs(lastValue);
        const absPrev = Math.abs(prevValue);
        const absNum = Math.abs(num);
        if (absLast === absNum && absPrev === absNum) return false;
      }
      
      return true;
    };

    // === ДРУЖЕСКИЕ ШАГИ ===
    // Перебираем ТОЛЬКО выбранные цифры friendsDigits (например, [1,2,3])
    // Это означает что будут доступны ТОЛЬКО эти действия через Друзья
    for (const n of friendsDigits) {
      const friend = 10 - n;

      // СЛОЖЕНИЕ через друзей: +n = +10 - friend
      if (!onlySubtraction) {
        if (!isFirstAction || n > 0) { // первый шаг должен быть положительным
          if (this.canApplyPlusFriend(v, n, state, position)) {
            if (canUseNumber(n)) {
              friendActions.push({
                value: n,
                isFriend: true,
                friendN: n,
                direction: "plus",
                formula: [
                  { op: "+", val: 10 },
                  { op: "-", val: friend }
                ],
                label: `+${n} через 10 (друг ${n})`
              });
            }
          }
        }
      }

      // ВЫЧИТАНИЕ через друзей: -n = -10 + friend
      if (!onlyAddition && !isFirstAction) {
        if (this.canApplyMinusFriend(v, n, state, position)) {
          if (canUseNumber(-n)) {
            friendActions.push({
              value: -n,
              isFriend: true,
              friendN: n,
              direction: "minus",
              formula: [
                { op: "-", val: 10 },
                { op: "+", val: friend }
              ],
              label: `-${n} через 10 (друг ${n})`
            });
          }
        }
      }
    }

    // === ПРОСТЫЕ ВСПОМОГАТЕЛЬНЫЕ ШАГИ ===
    // Простые шаги всегда доступны для поддержания разнообразия примера

    // Сложение (простое)
    for (const digit of simpleBlockDigits) {
      if (isFirstAction && digit <= 0) continue;
      if (!canUseNumber(digit)) continue;
      
      if (this._canPlusDirect(v, digit)) {
        simpleActions.push(digit);
      }
    }

    // Вычитание (простое)
    if (!isFirstAction) {
      for (const digit of simpleBlockDigits) {
        if (!canUseNumber(-digit)) continue;
        
        if (this._canMinusDirect(v, digit)) {
          simpleActions.push(-digit);
        }
      }
    }

    // === ВОЗВРАЩАЕМ ВСЕ ДОСТУПНЫЕ ДЕЙСТВИЯ ===
    // Генератор сам решит что выбрать: Friend-действие или простое
    // Валидация проверит что есть хотя бы 1 Friend-шаг в итоговом примере
    const allActions = [...friendActions, ...simpleActions];

    console.log(
      `🎲 Состояние ${v}: дружеских=${friendActions.length}, ` +
      `простых=${simpleActions.length}, всего=${allActions.length}`
    );

    return allActions;
  }

  /**
   * Применение действия к состоянию
   *
   * ВАЖНО: Для дружеских шагов нужно также обновить следующий разряд!
   * Если currentState - число, преобразуем в массив, применяем действие, возвращаем число.
   */
  applyAction(currentState, action) {
    const delta = typeof action === "object" ? action.value : action;
    const isFriend = typeof action === "object" && action.isFriend;

    // Если это простое число (не массив), обрабатываем как одноразрядный режим
    if (typeof currentState === 'number' && !isFriend) {
      return currentState + delta;
    }

    // Если это дружеский шаг в одноразрядном режиме - преобразуем в многозначный
    if (typeof currentState === 'number' && isFriend) {
      // Преобразуем число в массив разрядов
      const digits = [];
      let num = Math.abs(currentState);
      for (let i = 0; i < 10; i++) {
        digits.push(num % 10);
        num = Math.floor(num / 10);
        if (num === 0 && i >= 1) break;
      }

      // Применяем дружеское действие к массиву
      const newState = this.applyActionWithCarry(digits, 0, action);

      // Преобразуем обратно в число
      let result = 0;
      for (let i = 0; i < newState.length; i++) {
        result += newState[i] * Math.pow(10, i);
      }
      return result;
    }

    return currentState + delta;
  }

  /**
   * Применение действия с учётом переноса (для многозначных)
   * Возвращает новое состояние всего абакуса.
   * 
   * @param {number[]} fullState - полное состояние абакуса
   * @param {number} position - позиция разряда
   * @param {Object|number} action - действие
   * @returns {number[]} - новое состояние
   */
  applyActionWithCarry(fullState, position, action) {
    const newState = [...fullState];
    const delta = typeof action === "object" ? action.value : action;
    const isFriend = typeof action === "object" && action.isFriend;

    if (isFriend) {
      // Дружеский шаг: нужен перенос
      const direction = action.direction;
      const friend = 10 - action.friendN;

      if (direction === "plus") {
        // +n = +10 - friend
        // 1. Добавляем 1 к следующему разряду
        newState[position + 1] = (newState[position + 1] ?? 0) + 1;
        // 2. Вычитаем friend из текущего разряда
        newState[position] = newState[position] - friend;
      } else {
        // -n = -10 + friend
        // 1. Вычитаем 1 из следующего разряда
        newState[position + 1] = (newState[position + 1] ?? 0) - 1;
        // 2. Добавляем friend к текущему разряду
        newState[position] = newState[position] + friend;
      }
    } else {
      // Простой шаг: только текущий разряд
      newState[position] = newState[position] + delta;
    }

    return newState;
  }

  /**
   * Форматирование действия для отображения
   */
  formatAction(action) {
    if (typeof action === "object") {
      const val = action.value;
      const sign = val >= 0 ? "+" : "";
      return `${sign}${val}`;
    }
    return action >= 0 ? `+${action}` : `${action}`;
  }

  /**
   * Преобразование состояния в число
   */
  stateToNumber(state) {
    if (Array.isArray(state)) {
      return state.reduce((acc, digit, idx) => acc + digit * Math.pow(10, idx), 0);
    }
    return typeof state === "number" ? state : 0;
  }

  /**
   * Валидация примера: должен содержать хотя бы 1 дружеский шаг
   *
   * Поддерживает ОДНОРАЗРЯДНЫЕ и МНОГОЗНАЧНЫЕ примеры:
   * - Одноразрядные: start = 0, answer = 7
   * - Многозначные: start = [0,0,0], answer = [3,2,1] (123)
   */
  validateExample(example) {
    const { start, steps, answer } = example;
    const { minState, maxState } = this.config;

    if (!steps || steps.length < 1) {
      console.warn("❌ FriendsRule validateExample: нет шагов");
      return false;
    }

    // Определяем тип примера: одноразрядный или многозначный
    const isMultiDigit = Array.isArray(start);
    let hasFriend = false;
    const usedFriendDigits = new Set(); // Отслеживаем какие цифры Друзья использовались

    // Проходим по всем шагам и проверяем
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      // 🔴 КРИТИЧНО: Проверяем наличие дружеских шагов в ДВУХ форматах
      // Формат 1 (MultiDigitGenerator): step.hasFriend === true
      // Формат 2 (ExampleGenerator): step.action.isFriend === true
      if (step.hasFriend === true) {
        hasFriend = true;

        // Собираем информацию о том, какая цифра Друзья использовалась
        if (step.digits) {
          for (const digit of step.digits) {
            if (digit && digit.isFriend && digit.friendN) {
              usedFriendDigits.add(digit.friendN);
            }
          }
        }
      } else if (step.action && typeof step.action === 'object' && step.action.isFriend === true) {
        hasFriend = true;

        // Собираем информацию о том, какая цифра Друзья использовалась
        if (step.action.friendN) {
          usedFriendDigits.add(step.action.friendN);
        }
      }

      // Проверяем валидность состояния
      // Формат 1 (MultiDigitGenerator): step.states
      // Формат 2 (ExampleGenerator): step.toState
      const state = step.states || step.toState;

      if (state !== undefined) {
        if (isMultiDigit && Array.isArray(state)) {
          // Многозначный: проверяем каждый разряд
          for (let j = 0; j < state.length; j++) {
            if (state[j] < minState || state[j] > maxState) {
              console.warn(`❌ FriendsRule validateExample: шаг ${i+1}, разряд ${j} выход за диапазон [${minState}, ${maxState}]: ${state[j]}`);
              return false;
            }
          }
        } else if (!isMultiDigit && typeof state === 'number') {
          // Одноразрядный: проверяем число
          // НО! Для правила Друзья число может быть > 9 (перенос в следующий разряд)
          // Например: 7+9=16, где 16 = [6, 1] = 6 единиц + 1 десяток
          // Это валидно! Не проверяем maxState для однозначного режима с друзьями
          if (state < minState) {
            console.warn(`❌ FriendsRule validateExample: шаг ${i+1} выход за диапазон (< ${minState}): ${state}`);
            return false;
          }
        }
      }
    }

    // Проверяем финальный ответ
    const finalState = steps[steps.length - 1]?.states || steps[steps.length - 1]?.toState || answer;
    const answersMatch = isMultiDigit
      ? this._arraysEqual(finalState, answer)
      : finalState === answer;

    if (!answersMatch) {
      console.warn(`❌ FriendsRule validateExample: ответ не совпадает:`, { finalState, answer });
      return false;
    }

    if (!hasFriend) {
      console.warn("❌ FriendsRule validateExample: нет дружеских шагов");
      return false;
    }

    // 🔴 КРИТИЧНО: Проверяем что использованные цифры Друзья входят в разрешённый список
    const allowedDigits = new Set(this.config.friendsDigits);
    for (const usedDigit of usedFriendDigits) {
      if (!allowedDigits.has(usedDigit)) {
        console.warn(
          `❌ FriendsRule validateExample: использована цифра ${usedDigit}, ` +
          `которой нет в разрешённых [${this.config.friendsDigits.join(', ')}]`
        );
        return false;
      }
    }

    const usedDigitsStr = Array.from(usedFriendDigits).sort((a, b) => a - b).join(', ');
    console.log(
      `✅ FriendsRule validateExample: пример валидный ` +
      `(${steps.length} шагов, использованы друзья: [${usedDigitsStr}])`
    );
    return true;
  }

  /**
   * Применить многозначное действие с учётом переносов
   * @private
   */
  _applyMultiDigitAction(state, digits) {
    const newState = [...state];

    for (let pos = 0; pos < digits.length; pos++) {
      const action = digits[pos];
      if (!action) continue;

      if (typeof action === 'object' && action.isFriend && action.formula) {
        // Дружеский шаг: применяем формулу
        for (const part of action.formula) {
          if (Math.abs(part.val) === 10) {
            // Перенос в следующий разряд
            const carryValue = part.op === '+' ? 1 : -1;
            const nextPos = pos + 1;
            if (nextPos < newState.length) {
              newState[nextPos] += carryValue;
            }
          } else {
            // Действие на текущем разряде
            const digitValue = part.op === '+' ? part.val : -part.val;
            newState[pos] += digitValue;
          }
        }
      } else if (typeof action === 'object') {
        // Простой объект с value
        newState[pos] += (action.value || 0);
      } else {
        // Числовое действие
        newState[pos] += action;
      }
    }

    return newState;
  }

  /**
   * Применить числовое значение к массиву (для fallback)
   * @private
   */
  _applyNumericToArray(state, value) {
    const newState = [...state];
    let carry = value;

    for (let i = 0; i < newState.length && carry !== 0; i++) {
      newState[i] += carry;

      if (newState[i] >= 10) {
        carry = Math.floor(newState[i] / 10);
        newState[i] = newState[i] % 10;
      } else if (newState[i] < 0) {
        carry = -1;
        newState[i] += 10;
      } else {
        carry = 0;
      }
    }

    return newState;
  }

  /**
   * Сравнение двух массивов
   * @private
   */
  _arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => val === b[idx]);
  }
}
