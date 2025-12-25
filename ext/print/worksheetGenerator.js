// ext/print/worksheetGenerator.js
//
// Генератор листа примеров для печати.
// Использует тот же generateExample, что и тренажёр,
// но вызывает его много раз и возвращает массив примеров.

import { getState, setWorksheet } from "../../core/state.js";
import { generateExample } from "../core/generator.js";

/**
 * @typedef {Object} WorksheetExample
 * @property {number} index      Порядковый номер примера
 * @property {number} start      Стартовое число на абакусе
 * @property {string[]} steps    Шаги вида ["+3", "-1", "+4"]
 * @property {number} answer     Итоговое число
 */

/**
 * @typedef {Object} GenerateWorksheetOptions
 * @property {number} examplesCount  Сколько примеров сгенерировать
 * @property {boolean} showAnswers   Включать ли лист ответов
 */

/**
 * Генерация листа примеров для печати.
 *
 * @param {GenerateWorksheetOptions} [options]
 * @returns {{
 *   examples: WorksheetExample[],
 *   settings: any,
 *   createdAt: string,
 *   showAnswers: boolean
 * }}
 */
export function generateWorksheet(options = {}) {
  const { examplesCount = 20, showAnswers = false } = options;

  // 🆕 Логирование для отладки
  console.log("[worksheetGenerator] Received options:", options);
  console.log("[worksheetGenerator] showAnswers value:", showAnswers);

  const fullState = getState();
  const trainerSettings = fullState.settings;

  if (!trainerSettings) {
    console.warn("[worksheet] Нет настроек тренажёра — генерация невозможна");
    return null;
  }

  /** @type {WorksheetExample[]} */
  const examples = [];

  // Добавляем флаг silent для подавления логов при генерации печати
  const settingsForPrint = {
    ...trainerSettings,
    silent: true
  };

  for (let i = 0; i < examplesCount; i++) {
    const ex = generateExample(settingsForPrint);

    if (!ex) {
      console.warn("[worksheet] generateExample вернул пустой результат, пропуск:", i);
      continue;
    }

    examples.push({
      index: i + 1,
      start: ex.start,
      // Сохраняем структуру steps: строки остаются строками, объекты (Friends) копируются
      steps: Array.isArray(ex.steps)
        ? ex.steps.map(s => typeof s === 'object' && s !== null ? { ...s } : s)
        : [],
      answer: ex.answer
    });
  }

  const worksheet = {
    examples,
    settings: trainerSettings, // Передаем полные настройки для доступа к actions.count
    createdAt: new Date().toISOString(),
    showAnswers: Boolean(showAnswers),
    version: 2  // ✅ Версия формата данных (увеличиваем при изменении структуры)
  };

  // 🐛 ОТЛАДКА: выводим первый пример для проверки
  console.log('🐛 [worksheetGenerator] Создан worksheet version=2');
  console.log('🐛 [worksheetGenerator] Примеров:', examples.length);
  if (examples[0]) {
    console.log('🐛 [worksheetGenerator] Первый пример:', examples[0]);
    console.log('🐛 [worksheetGenerator] Первый шаг:', examples[0].steps[0]);
  }

  setWorksheet(worksheet);

  return worksheet;
}

/**
 * (На будущее)
 * Получает текущий worksheet, если ты решишь сохранить его в state
 */
export function getCurrentWorksheet() {
  const fullState = getState();
  return fullState.worksheet || {
    examples: [],
    settings: null,
    createdAt: null,
    showAnswers: false
  };
}
