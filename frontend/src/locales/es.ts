import base from '@/locales/es/base.json'
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
import theFeastOfHemlockVale from '@/locales/en/theFeastOfHemlockVale'

// Anything missing here falls back to English key by key (fallbackLocale in
// main.ts). Mirrors en.ts: `label` has to be nested -- the app asks for
// t('label.play') -- and `label.cards` is the `label` section of cards.json.
// cardOption.json and event.json (Epic Multiplayer) have no Spanish yet.
export default
  { ...base
  , ...campaignLog
  , ...gameBoard
  , cards
  , investigators
  , label: { ...label, cards: cards["label"] }
  , log
  , xp
  , nightOfTheZealot
  , theDunwichLegacy
  , thePathToCarcosa
  , theFeastOfHemlockVale
  }
