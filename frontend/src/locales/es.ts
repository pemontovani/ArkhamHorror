import base from '@/locales/es/base.json'
import modifiers from '@/locales/es/modifiers.json'
import traits from '@/locales/es/traits.json'
import { homebrewMessages } from '@/locales/homebrew'
import cardOption from '@/locales/es/cardOption.json'
import event from '@/locales/es/event.json'
import log from '@/locales/es/log.json'
import cards from '@/locales/es/cards.json'
import label from '@/locales/es/label.json'
import investigators from '@/locales/es/investigators.json'
import campaignLog from '@/locales/es/campaignLog.json'
import xp from '@/locales/es/xp.json'
import gameBoard from '@/locales/es/gameBoard/gameBoard'
import nightOfTheZealot from '@/locales/es/nightOfTheZealot'
import theDunwichLegacy from '@/locales/es/theDunwichLegacy'
import thePathToCarcosa from '@/locales/es/thePathToCarcosa'
import theForgottenAge from '@/locales/es/theForgottenAge'
import theCircleUndone from '@/locales/es/theCircleUndone'
import theDreamEaters from '@/locales/es/theDreamEaters'
import theInnsmouthConspiracy from '@/locales/es/theInnsmouthConspiracy'
import edgeOfTheEarth from '@/locales/es/edgeOfTheEarth'
import theScarletKeys from '@/locales/es/theScarletKeys'
import theFeastOfHemlockVale from '@/locales/es/theFeastOfHemlockVale'
import theDrownedCity from '@/locales/es/theDrownedCity'
import brethrenOfAsh from '@/locales/es/brethrenOfAsh'
import standalone from '@/locales/es/standalone'
import theLabyrinthsOfLunacyLog from '@/locales/es/theLabyrinthsOfLunacy.json'

// Anything missing here falls back to English key by key (fallbackLocale in
// main.ts). Mirrors en.ts: `label` has to be nested -- the app asks for
// t('label.play') -- and `label.cards` is the `label` section of cards.json.
export default
  { ...base
  , ...cardOption
  , ...event
  , ...campaignLog
  , ...gameBoard
  , ...modifiers
  , ...traits
  , cards
  , investigators
  , label: { ...label, cards: cards["label"] }
  , log
  , xp
  , nightOfTheZealot
  , theDunwichLegacy
  , thePathToCarcosa
  , theForgottenAge
  , returnToTheForgottenAge: theForgottenAge
  , theCircleUndone
  , theDreamEaters
  , theInnsmouthConspiracy
  , edgeOfTheEarth
  , theScarletKeys
  , theFeastOfHemlockVale
  , theDrownedCity
  , brethrenOfAsh
  , standalone
  , theLabyrinthsOfLunacy: theLabyrinthsOfLunacyLog
  , ...homebrewMessages('es', traits.trait)
  }
