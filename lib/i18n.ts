"use client"
import { useGameStore } from './store'

export type Lang = 'en' | 'ru' | 'he'
export type I18nKey =
  | 'appTitle'
  | 'subtitle'
  | 'startPlaying'
  | 'continue'
  | 'settings'
  | 'session'
  | 'exit'
  | 'noSessionYet'
  | 'language'
  | 'theme'
  | 'menu'
  | 'pool'
  | 'dragToPool'
  | 'countTogether'
  | 'rewards'
  | 'unlocked'
  | 'use'
  | 'locked'
  | 'cost'
  | 'points'
  | 'level'

const D: Record<Lang, Record<I18nKey, string>> = {
  en: {
    appTitle: 'MathTik',
    subtitle: 'Multiply & Divide with fun mini-games',
    startPlaying: 'Start Playing',
    continue: 'Continue',
    settings: 'Settings',
    session: 'Session',
    exit: 'Exit',
    noSessionYet: 'No session yet',
    language: 'Language',
    theme: 'Theme',
    menu: 'Menu',
    pool: 'Pool',
    dragToPool: 'Drag the apples to the pool',
    countTogether: 'Let’s count together',
    rewards: 'Rewards',
    unlocked: 'Unlocked',
    use: 'Use',
    locked: 'Locked',
    cost: 'Cost',
    points: 'Points',
    level: 'Level',
  },
  ru: {
    appTitle: 'МэтТик',
    subtitle: 'Умножай и дели в веселых мини-играх',
    startPlaying: 'Начать игру',
    continue: 'Продолжить',
    settings: 'Настройки',
    session: 'Сессия',
    exit: 'Выход',
    noSessionYet: 'Сессий пока нет',
    language: 'Язык',
    theme: 'Тема',
    menu: 'Меню',
    pool: 'Корзина',
    dragToPool: 'Перетащи яблоки в корзину',
    countTogether: 'Давайте посчитаем вместе',
    rewards: 'Награды',
    unlocked: 'Открыто',
    use: 'Использовать',
    locked: 'Закрыто',
    cost: 'Цена',
    points: 'Очки',
    level: 'Уровень',
  },
  he: {
    appTitle: 'מתיק',
    subtitle: 'כפל וחילוק במשחקונים מהנים',
    startPlaying: 'התחל משחק',
    continue: 'להמשיך',
    settings: 'הגדרות',
    session: 'סשן',
    exit: 'יציאה',
    noSessionYet: 'אין סשן עדיין',
    language: 'שפה',
    theme: 'ערכת נושא',
    menu: 'תפריט',
    pool: 'סל',
    dragToPool: 'גררו את התפוחים לסל',
    countTogether: 'נספור יחד',
    rewards: 'פרסים',
    unlocked: 'נפתח',
    use: 'השתמש',
    locked: 'נעול',
    cost: 'עלות',
    points: 'נקודות',
    level: 'רמה',
  },
}

export function useI18n() {
  const lang = useGameStore(s => s.profile.language || 'en') as Lang
  return (k: I18nKey) => D[lang][k]
}

export function tFor(lang: Lang) {
  return (k: I18nKey) => D[lang][k]
}
