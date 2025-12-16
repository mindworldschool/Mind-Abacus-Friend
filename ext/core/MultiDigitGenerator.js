// ext/core/MultiDigitGenerator.js - Генератор многозначных примеров
//
// Поддерживает:
// - UnifiedSimpleRule (Просто)
// - BrothersRule (Братья - через 5)
// - FriendsRule (Друзья - через 10) - С ПЕРЕНОСАМИ!

/**
 * MultiDigitGenerator - класс-обёртка для генерации многозначных примеров.
 * 
 * КЛЮЧЕВЫЕ ОСОБЕННОСТИ:
 * 1. Каждый разряд живёт по правилам базового правила (физика абакуса)
 * 2. Использует ВЫБРАННЫЕ в настройках цифры (selectedDigits из config)
 * 3. Поддержка переменной разрядности (+389-27+164)
 * 4. Для FriendsRule: обработка ПЕРЕНОСОВ между разрядами!
 * 
 * ОГРАНИЧЕНИЯ:
 *   - Круглые числа (+10, +20...): вероятность 15%, макс 1 на пример
 *   - Ответы могут быть любой разрядности, но не превышают выбранную
 */

export class MultiDigitGenerator {
  constructor(RuleClass, maxDigitCount, config = {}) {
    this.baseRule = new RuleClass(config);
    
    // Определяем тип правила
    this.isFriendsRule = RuleClass.name === 'FriendsRule' || this.baseRule.name === 'Друзья';
    this.isBrothersRule = RuleClass.name === 'BrothersRule' || this.baseRule.name === 'Братья';
    this.isSimpleRule = RuleClass.name === 'UnifiedSimpleRule' || 
                        this.baseRule.name === 'Просто' || 
                        (!this.isFriendsRule && !this.isBrothersRule);
    
    // Количество разрядов
    this.displayDigitCount = Math.max(1, Math.min(9, maxDigitCount));
    this.maxDigitCount = this.displayDigitCount + 1; // +1 для переноса
    
    console.log(`📊 Разрядность: пример=${this.displayDigitCount}, абакус=${this.maxDigitCount}`);
    
    this.config = {
      ...config,
      maxDigitCount: this.maxDigitCount,
      variableDigitCounts: config.variableDigitCounts || false,
      duplicateDigitProbability: 0.1,
      maxZeroDigits: 1,
      roundNumberProbability: 0.15,
      maxRoundNumbersPerExample: 1,
      _duplicatesUsed: 0,
      _zeroDigitsUsed: 0,
      _roundNumbersUsed: 0
    };
    
    const ruleType = this.isFriendsRule ? 'Friends' : (this.isBrothersRule ? 'Brothers' : 'Simple');
    this.name = `${this.baseRule.name} (Multi-Digit ${this.displayDigitCount}, ${ruleType})`;
    
    const selectedDigits = this.baseRule.config?.selectedDigits || [];
    
    console.log(`🔢 MultiDigitGenerator создан:
  Базовое правило: ${this.baseRule.name}
  Тип: ${ruleType}
  Разрядность примера: ${this.displayDigitCount}
  Выбранные цифры: [${selectedDigits.join(', ')}]
  isFriends: ${this.isFriendsRule}, isBrothers: ${this.isBrothersRule}, isSimple: ${this.isSimpleRule}`);
  }

  generateStartState() {
    return Array(this.maxDigitCount).fill(0);
  }

  generateStepsCount() {
    return this.baseRule.generateStepsCount();
  }

  generateExample() {
    if (this.isFriendsRule) {
      return this._generateFriendsExample();
    }
    return this._generateStandardExample();
  }

  // ========== FRIENDS ГЕНЕРАЦИЯ (НОВАЯ ЛОГИКА) ==========

  /**
   * 🆕 ПЕРЕПИСАНО: Генерация примера с правилом Друзья
   *
   * КЛЮЧЕВОЕ ОТЛИЧИЕ ОТ СТАРОЙ ВЕРСИИ:
   * - Генерируем ОДНОЗНАЧНЫЕ действия (+1, +2, +3), а не многозначные (+14, +31)
   * - Используем Simple действия для подготовки состояния
   * - Применяем Friends действия когда физически возможно
   * - Работает для ВСЕХ разрядностей (2, 3, 4, и т.д.)
   */
  _generateFriendsExample(retryDepth = 0) {
    const maxRetryDepth = 3;

    let states = this.generateStartState();
    const stepsCount = this.generateStepsCount();
    const steps = [];

    console.log(`🤝 [НОВАЯ ЛОГИКА] Генерация Friends: ${stepsCount} шагов, ${this.displayDigitCount} разрядов`);
    console.log(`   Выбранные цифры для Friends: [${this.baseRule.config.friendsDigits.join(', ')}]`);

    let friendStepsCount = 0;
    let attempts = 0;
    const maxAttempts = 1000;

    // Целевое количество Friends действий (минимум 1, лучше 30-50% от общего)
    const minFriendSteps = 1;
    const targetFriendSteps = Math.max(1, Math.floor(stepsCount * 0.4));

    while (steps.length < stepsCount && attempts < maxAttempts) {
      attempts++;
      const isFirst = steps.length === 0;

      // Решаем: пытаться ли сгенерировать Friends действие
      const needMoreFriends = friendStepsCount < targetFriendSteps;
      const tryFriend = needMoreFriends || (friendStepsCount >= minFriendSteps && Math.random() < 0.5);

      let action = null;

      if (tryFriend) {
        // Пытаемся сгенерировать Friends действие
        action = this._tryGenerateFriendAction(states, isFirst);
      }

      if (!action) {
        // Если Friends не получилось, используем Simple действие
        action = this._tryGenerateSimpleAction(states, isFirst, steps);
      }

      if (!action) {
        continue; // Ничего не подошло, пробуем ещё раз
      }

      // Применяем действие
      const newStates = this._applySingleDigitAction(states, action.value);

      if (!newStates) {
        continue;
      }

      // Проверяем валидность
      if (!this._isValidState(newStates)) {
        continue;
      }

      // Проверяем переполнение разрядности
      if (this._checkOverflow(newStates)) {
        continue;
      }

      // Добавляем шаг
      if (action.isFriend) {
        friendStepsCount++;
      }

      steps.push({
        action: action.value,
        states: [...newStates],
        hasFriend: action.isFriend
      });

      states = newStates;

      const signStr = action.value >= 0 ? '+' : '';
      console.log(`  ✅ Шаг ${steps.length}/${stepsCount}: ${signStr}${action.value}${action.isFriend ? ' (FRIEND!)' : ' (simple)'}`);
    }

    // Проверка: есть ли хотя бы 1 Friends действие?
    if (friendStepsCount === 0 && retryDepth < maxRetryDepth) {
      console.warn(`⚠️ Нет Friends шагов! Перегенерация... (попытка ${retryDepth + 1}/${maxRetryDepth})`);
      return this._generateFriendsExample(retryDepth + 1);
    }

    if (friendStepsCount === 0) {
      console.error(`❌ Не удалось сгенерировать Friends пример после ${maxRetryDepth + 1} попыток!`);
    }

    console.log(`✅ Friends пример готов: ${steps.length} шагов, ${friendStepsCount} Friends переходов`);

    return {
      start: this.generateStartState(),
      steps,
      answer: [...states]
    };
  }

  /**
   * 🆕 Попытка сгенерировать Friends действие
   * Возвращает {value: number, isFriend: boolean} или null
   */
  _tryGenerateFriendAction(states, isFirst) {
    const friendsDigits = this.baseRule.config.friendsDigits || [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const onlyAddition = this.baseRule.config.onlyAddition || false;
    const onlySubtraction = this.baseRule.config.onlySubtraction || false;

    // Пробуем каждую выбранную цифру в случайном порядке
    const shuffled = [...friendsDigits].sort(() => Math.random() - 0.5);

    for (const digit of shuffled) {
      // Проверяем на первом разряде (position = 0) для всех разрядностей
      const position = 0;
      const currentValue = states[position];

      // Пробуем +digit
      if (!onlySubtraction && (isFirst || digit > 0)) {
        if (this.baseRule.canApplyFriendAddition(digit, currentValue, states, position)) {
          return {value: digit, isFriend: true};
        }
      }

      // Пробуем -digit
      if (!onlyAddition && !isFirst) {
        if (this.baseRule.canApplyFriendSubtraction(digit, currentValue, states, position)) {
          return {value: -digit, isFriend: true};
        }
      }
    }

    return null;
  }

  /**
   * 🆕 Попытка сгенерировать Simple действие для подготовки/разнообразия
   */
  _tryGenerateSimpleAction(states, isFirst, previousSteps) {
    const simpleDigits = this.baseRule.config.simpleBlockDigits || [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const position = 0;
    const currentValue = states[position];

    // Получаем доступные простые действия
    const availableActions = [];

    for (const digit of simpleDigits) {
      // +digit
      if (isFirst || digit > 0) {
        if (this.baseRule._canPlusDirect(currentValue, digit)) {
          availableActions.push(digit);
        }
      }

      // -digit
      if (!isFirst) {
        if (this.baseRule._canMinusDirect(currentValue, digit)) {
          availableActions.push(-digit);
        }
      }
    }

    if (availableActions.length === 0) {
      return null;
    }

    // Выбираем случайное действие
    const action = availableActions[Math.floor(Math.random() * availableActions.length)];

    return {value: action, isFriend: false};
  }

  /**
   * 🆕 Применить ОДНОЗНАЧНОЕ действие к многозначному числу
   * value: +1, +2, -1, и т.д. (ОДНОЗНАЧНОЕ!)
   * states: [4, 3, 0] (трёхзначное число 034)
   */
  _applySingleDigitAction(states, value) {
    const newStates = [...states];
    const position = 0; // Работаем с первым разрядом (единицы)

    // Применяем действие через baseRule
    const result = this.baseRule.applyAction(states[position], value, position, states);

    if (result === null || result === undefined) {
      return null;
    }

    // Если результат - массив (с переносом), обновляем все разряды
    if (Array.isArray(result)) {
      for (let i = 0; i < Math.min(result.length, newStates.length); i++) {
        newStates[i] = result[i];
      }
    } else {
      // Иначе обновляем только текущий разряд
      newStates[position] = result;
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

  _generateFriendsMultiDigitAction(states, isFirst, previousSteps) {
    const maxAttempts = 50;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const actionsPerPosition = [];
      
      for (let pos = 0; pos < this.displayDigitCount; pos++) {
        const currentState = states[pos];
        const isFirstForDigit = currentState === 0;
        
        const availableActions = this.baseRule.getAvailableActions(
          currentState,
          isFirstForDigit,
          pos,
          states,
          previousSteps
        );
        
        if (!availableActions || availableActions.length === 0) {
          actionsPerPosition[pos] = [{ value: 0, isFriend: false }];
        } else {
          actionsPerPosition[pos] = availableActions.map(a => {
            if (typeof a === 'object') return a;
            return { value: a, isFriend: false };
          });
        }
      }
      
      // Определяем знаки
      const possibleSigns = new Set();
      for (const actions of actionsPerPosition) {
        for (const action of actions) {
          const val = action.value !== undefined ? action.value : action;
          if (val > 0) possibleSigns.add(1);
          if (val < 0) possibleSigns.add(-1);
        }
      }
      
      if (possibleSigns.size === 0) continue;
      
      // Приоритизация знака
      const signs = Array.from(possibleSigns);
      const avgState = states.slice(0, this.displayDigitCount).reduce((s, v) => s + v, 0) / this.displayDigitCount;
      
      if (avgState >= 7 && possibleSigns.has(-1)) {
        signs.sort((a, b) => a - b);
      } else if (avgState <= 2 && possibleSigns.has(1) && !isFirst) {
        signs.sort((a, b) => b - a);
      } else {
        for (let i = signs.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [signs[i], signs[j]] = [signs[j], signs[i]];
        }
      }
      
      for (const targetSign of signs) {
        const digits = [];
        let hasFriend = false;
        let success = true;
        
        for (let pos = 0; pos < this.displayDigitCount; pos++) {
          const actions = actionsPerPosition[pos];
          
          let filtered = actions.filter(a => {
            const val = a.value !== undefined ? a.value : a;
            return Math.sign(val) === targetSign || val === 0;
          });
          
          if (filtered.length === 0) {
            digits[pos] = { value: 0, isFriend: false };
            continue;
          }
          
          // Первый шаг - старший разряд должен быть > 0
          if (isFirst && pos === this.displayDigitCount - 1) {
            filtered = filtered.filter(a => {
              const val = a.value !== undefined ? a.value : a;
              return val > 0;
            });
            if (filtered.length === 0) {
              success = false;
              break;
            }
          }
          
          const chosen = filtered[Math.floor(Math.random() * filtered.length)];
          digits[pos] = chosen;
          
          if (chosen.isFriend) {
            hasFriend = true;
          }
        }
        
        if (!success) continue;
        
        // Проверка на ненулевое значение
        const hasNonZero = digits.some(d => {
          const val = d.value !== undefined ? d.value : d;
          return val !== 0;
        });
        if (!hasNonZero) continue;
        
        // Старший разряд не ноль
        const highestVal = digits[this.displayDigitCount - 1]?.value !== undefined 
          ? digits[this.displayDigitCount - 1].value 
          : digits[this.displayDigitCount - 1];
        if (highestVal === 0) continue;
        
        // Считаем значение
        let value = 0;
        for (let pos = 0; pos < this.displayDigitCount; pos++) {
          const d = digits[pos]?.value !== undefined ? digits[pos].value : digits[pos];
          value += Math.abs(d) * Math.pow(10, pos);
        }
        
        // Тестируем применение
        const testStates = this._applyFriendsDigits(states, digits);
        if (!testStates) continue;
        
        let allValid = true;
        for (let i = 0; i < this.displayDigitCount; i++) {
          if (testStates[i] < 0 || testStates[i] > 9) {
            allValid = false;
            break;
          }
        }
        if (!allValid) continue;
        
        // 🔴 КРИТИЧНО: Проверка переполнения разрядности!
        if (this._checkOverflow(testStates)) {
          continue; // Это действие приведёт к переполнению
        }
        
        return { value, sign: targetSign, digits, hasFriend };
      }
    }
    
    return null;
  }

  _applyFriendsDigits(states, digits) {
    const newStates = [...states];
    
    for (let pos = 0; pos < this.displayDigitCount; pos++) {
      const action = digits[pos];
      if (!action) continue;
      
      if (typeof action === 'object' && action.isFriend && action.formula) {
        for (const part of action.formula) {
          if (Math.abs(part.val) === 10) {
            const carryValue = part.op === '+' ? 1 : -1;
            const nextPos = pos + 1;
            if (nextPos < this.maxDigitCount) {
              newStates[nextPos] += carryValue;
            } else {
              return null;
            }
          } else {
            const digitValue = part.op === '+' ? part.val : -part.val;
            newStates[pos] += digitValue;
          }
        }
      } else if (typeof action === 'object') {
        newStates[pos] += (action.value || 0);
      } else {
        newStates[pos] += action;
      }
    }
    
    return newStates;
  }

  // ========== СТАНДАРТНАЯ ГЕНЕРАЦИЯ (Просто, Братья) ==========
  
  _generateStandardExample() {
    const states = this.generateStartState();
    const stepsCount = this.generateStepsCount();
    const steps = [];
    
    console.log(`🎯 Генерация стандартного примера: ${stepsCount} шагов`);
    
    this.config._duplicatesUsed = 0;
    this.config._zeroDigitsUsed = 0;
    this.config._roundNumbersUsed = 0;
    
    let attempts = 0;
    const maxAttempts = 1000;
    
    while (steps.length < stepsCount && attempts < maxAttempts) {
      attempts++;
      const isFirst = steps.length === 0;
      
      const result = this._generateMultiDigitAction(states, isFirst, steps);
      
      if (!result) continue;
      
      const newStates = [...states];
      for (let pos = 0; pos < this.displayDigitCount; pos++) {
        newStates[pos] += (result.digits[pos] || 0);
      }
      
      let allValid = true;
      for (let pos = 0; pos < this.displayDigitCount; pos++) {
        if (newStates[pos] < 0 || newStates[pos] > 9) {
          allValid = false;
          break;
        }
      }
      
      if (!allValid) continue;
      
      // 🔴 КРИТИЧНО: Проверка переполнения разрядности!
      // Для Братьев тоже возможен перенос в следующий разряд
      if (this._checkOverflow(newStates)) {
        console.log(`  ⚠️ Переполнение разрядности! Пропускаем шаг.`);
        continue;
      }
      
      steps.push({
        action: result.sign * result.value,
        states: [...newStates],
        digits: result.digits
      });
      
      for (let pos = 0; pos < this.displayDigitCount; pos++) {
        states[pos] = newStates[pos];
      }
      
      console.log(`  ✅ Шаг ${steps.length}: ${result.sign > 0 ? '+' : ''}${result.value}`);
    }
    
    return {
      start: this.generateStartState(),
      steps,
      answer: [...states]
    };
  }

  _generateMultiDigitAction(states, isFirst, previousSteps) {
    const maxAttempts = 100;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const digitCount = this._chooseDigitCount(isFirst);
      const result = this._generateDigits(states, digitCount, isFirst, previousSteps);
      
      if (!result) continue;
      
      if (this._validateMultiDigitAction(result, states, isFirst)) {
        return result;
      }
    }
    
    return null;
  }

  _chooseDigitCount(isFirst) {
    if (isFirst || !this.config.variableDigitCounts) {
      return this.displayDigitCount;
    }
    
    const minDigits = Math.max(1, this.displayDigitCount - 1);
    const maxDigits = this.displayDigitCount;
    
    if (minDigits === maxDigits) return maxDigits;
    
    return Math.random() < 0.7 ? maxDigits : minDigits;
  }

  _generateDigits(states, digitCount, isFirst, previousSteps) {
    const allowDuplicates = Math.random() < this.config.duplicateDigitProbability;
    
    const actionsPerPosition = [];
    
    for (let pos = 0; pos < this.displayDigitCount; pos++) {
      const currentState = states[pos];
      const isFirstForDigit = (currentState === 0);
      
      let availableActions;
      
      // Разные правила имеют разные сигнатуры getAvailableActions
      try {
        if (this.isBrothersRule) {
          // BrothersRule: (currentState, isFirst, previousSteps)
          availableActions = this.baseRule.getAvailableActions(currentState, isFirstForDigit, previousSteps);
        } else if (this.isFriendsRule) {
          // FriendsRule: (currentState, isFirst, position, fullState, previousSteps)
          availableActions = this.baseRule.getAvailableActions(currentState, isFirstForDigit, pos, states, previousSteps);
        } else {
          // UnifiedSimpleRule: (currentState, isFirst) или (currentState, isFirst, previousSteps)
          availableActions = this.baseRule.getAvailableActions(currentState, isFirstForDigit, previousSteps);
        }
      } catch (e) {
        // Fallback на простой вызов
        availableActions = this.baseRule.getAvailableActions(currentState, isFirstForDigit);
      }
      
      if (!availableActions || availableActions.length === 0) {
        actionsPerPosition[pos] = [];
        continue;
      }
      
      const actions = [];
      for (const action of availableActions) {
        const value = this._getActionValue(action);
        if (value !== 0) actions.push(value);
      }
      
      actionsPerPosition[pos] = actions;
    }
    
    const hasAnyActions = actionsPerPosition.some(arr => arr.length > 0);
    if (!hasAnyActions) return null;
    
    // Знаки
    const possibleSigns = new Set();
    for (const actions of actionsPerPosition) {
      for (const action of actions) {
        if (action > 0) possibleSigns.add(1);
        if (action < 0) possibleSigns.add(-1);
      }
    }
    
    if (possibleSigns.size === 0) return null;
    
    const signs = Array.from(possibleSigns);
    for (let i = signs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [signs[i], signs[j]] = [signs[j], signs[i]];
    }
    
    for (const targetSign of signs) {
      const digits = Array(this.maxDigitCount).fill(0);
      const usedDigits = new Set();
      let success = true;
      
      for (let pos = 0; pos < this.displayDigitCount; pos++) {
        const actions = actionsPerPosition[pos];
        if (!actions || actions.length === 0) continue;
        
        let filtered = actions.filter(a => Math.sign(a) === targetSign);
        
        if (isFirst && pos === this.displayDigitCount - 1 && filtered.length === 0 && targetSign < 0) {
          success = false;
          break;
        }
        
        if (filtered.length === 0) continue;
        
        if (!allowDuplicates) {
          const unique = filtered.filter(a => !usedDigits.has(Math.abs(a)));
          if (unique.length > 0) filtered = unique;
        }
        
        const chosen = filtered[Math.floor(Math.random() * filtered.length)];
        digits[pos] = chosen;
        usedDigits.add(Math.abs(chosen));
      }
      
      if (!success) continue;
      
      const hasNonZero = digits.some(d => d !== 0);
      if (!hasNonZero) continue;
      
      if (digits[digitCount - 1] === 0) continue;
      
      let value = 0;
      let finalSign = 0;
      
      for (let pos = 0; pos < this.displayDigitCount; pos++) {
        const d = digits[pos];
        if (d !== 0) {
          value += Math.abs(d) * Math.pow(10, pos);
          if (finalSign === 0) finalSign = Math.sign(d);
        }
      }
      
      return { value, sign: finalSign, digits, digitCount };
    }
    
    return null;
  }

  _validateMultiDigitAction(result, states, isFirst) {
    const { digits, value } = result;
    
    if (value === 0) return false;
    
    // Круглые числа
    if (this._isRoundNumber(value)) {
      if (this.config._roundNumbersUsed >= this.config.maxRoundNumbersPerExample) {
        return false;
      }
      if (Math.random() > this.config.roundNumberProbability) {
        return false;
      }
      this.config._roundNumbersUsed++;
    }
    
    // Валидность состояний
    for (let pos = 0; pos < this.displayDigitCount; pos++) {
      const newState = states[pos] + digits[pos];
      if (newState < 0 || newState > 9) {
        return false;
      }
    }
    
    return true;
  }

  _isRoundNumber(value) {
    const absValue = Math.abs(value);
    return absValue >= 10 && absValue % 10 === 0;
  }

  /**
   * Проверка переполнения разрядности.
   * Для 2-значных чисел результат должен быть 0-99, не 357!
   * По ТЗ: "Результат не выходит за пределы выбранной разрядности"
   */
  _checkOverflow(states) {
    // Проверяем, что все разряды ВЫШЕ displayDigitCount равны 0
    for (let i = this.displayDigitCount; i < this.maxDigitCount; i++) {
      if (states[i] !== 0) {
        return true; // Есть переполнение!
      }
    }
    return false; // Нет переполнения
  }

  /**
   * Получить полное числовое значение состояния (включая перенос).
   * Используется для отладки и проверки.
   */
  _getFullValue(states) {
    let result = 0;
    for (let i = 0; i < this.maxDigitCount && i < states.length; i++) {
      result += states[i] * Math.pow(10, i);
    }
    return result;
  }

  _getActionValue(action) {
    if (typeof action === 'object' && action !== null) {
      return action.value !== undefined ? action.value : 0;
    }
    return action;
  }

  // ========== ОБЩИЕ МЕТОДЫ ==========

  applyAction(state, action) {
    if (typeof action === 'object' && action.digits) {
      const newState = [...state];
      
      for (let pos = 0; pos < this.displayDigitCount; pos++) {
        const digit = action.digits[pos];
        if (!digit) continue;
        
        if (typeof digit === 'object' && digit.isFriend && digit.formula) {
          for (const part of digit.formula) {
            if (Math.abs(part.val) === 10) {
              const carryValue = part.op === '+' ? 1 : -1;
              const nextPos = pos + 1;
              if (nextPos < this.maxDigitCount) {
                newState[nextPos] += carryValue;
              }
            } else {
              const digitValue = part.op === '+' ? part.val : -part.val;
              newState[pos] += digitValue;
            }
          }
        } else if (typeof digit === 'object') {
          newState[pos] += (digit.value || 0);
        } else {
          newState[pos] += digit;
        }
      }
      
      return newState;
    }
    
    const actionValue = typeof action === 'object' ? action.action : action;
    const absValue = Math.abs(actionValue);
    const sign = Math.sign(actionValue);
    const digits = this._numberToDigits(absValue);
    
    const newState = [...state];
    for (let pos = 0; pos < this.maxDigitCount; pos++) {
      newState[pos] += sign * (digits[pos] || 0);
    }
    return newState;
  }

  _numberToDigits(num) {
    const digits = [];
    let n = Math.abs(num);
    
    for (let i = 0; i < this.maxDigitCount; i++) {
      digits.push(n % 10);
      n = Math.floor(n / 10);
    }
    
    return digits;
  }

  stateToNumber(state) {
    if (!Array.isArray(state)) return 0;
    
    let result = 0;
    for (let i = 0; i < this.displayDigitCount && i < state.length; i++) {
      result += state[i] * Math.pow(10, i);
    }
    
    return result;
  }

  isValidState(state) {
    if (!Array.isArray(state)) return false;
    return state.every(digit => digit >= 0 && digit <= 9);
  }

  formatAction(action) {
    const value = typeof action === 'object' ? action.value : action;
    return value >= 0 ? `+${value}` : `${value}`;
  }

  validateExample(example) {
    const { start, steps, answer } = example;
    
    if (!Array.isArray(start) || start.some(s => s !== 0)) {
      console.error('❌ MultiDigit: стартовое состояние должно быть [0,0,...]');
      return false;
    }
    
    let currentStates = [...start];
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      if (i === 0 && step.action < 0) {
        console.error('❌ MultiDigit: первый шаг должен быть положительным');
        return false;
      }
      
      currentStates = this.applyAction(currentStates, step);
      
      if (!this.isValidState(currentStates)) {
        console.error(`❌ MultiDigit: шаг ${i + 1} невалиден`);
        return false;
      }
      
      // Проверка переполнения разрядности
      if (this._checkOverflow(currentStates)) {
        console.error(`❌ MultiDigit: шаг ${i + 1} - переполнение разрядности!`);
        return false;
      }
    }
    
    const finalNumber = this.stateToNumber(currentStates);
    const answerNumber = this.stateToNumber(answer);
    
    if (finalNumber !== answerNumber) {
      console.error(`❌ MultiDigit: финал ${finalNumber} ≠ ответ ${answerNumber}`);
      return false;
    }
    
    if (this.isFriendsRule) {
      const friendSteps = steps.filter(s => s.hasFriend);
      if (friendSteps.length === 0) {
        console.error('❌ MultiDigit Friends: нет Friend-шагов!');
        return false;
      }
    }
    
    console.log(`✅ MultiDigit: пример валиден`);
    return true;
  }
}
