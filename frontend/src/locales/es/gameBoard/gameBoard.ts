import base from '@/locales/es/gameBoard/base.json'
import phase from '@/locales/es/gameBoard/phases.json'
import skillTest from '@/locales/es/gameBoard/skill_test.json'
import gameBar from '@/locales/es/gameBoard/game_bar.json'
import historyPanel from '@/locales/es/gameBoard/history_panel.json'
import investigator from '@/locales/es/gameBoard/investigator.json'
import scenario from '@/locales/es/gameBoard/scenario.json'
import card from '@/locales/es/gameBoard/card.json'
import upgrade from '@/locales/es/gameBoard/upgrade.json'
import create from '@/locales/es/gameBoard/create.json'
import ultimatumsAndBoons from '@/locales/es/gameBoard/ultimatumsAndBoons.json'
import achievements from '@/locales/es/gameBoard/achievements.json'

// Any key a Spanish file leaves out falls back to English (fallbackLocale in
// main.ts), so a partial translation is safe.
export default {...base, phase, skillTest, gameBar, historyPanel, investigator, scenario, card, upgrade, create, ultimatumsAndBoons, achievements}
