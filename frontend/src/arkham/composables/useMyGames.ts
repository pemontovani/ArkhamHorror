import { computed, ref, type Ref } from 'vue'
import { fetchEvents, fetchGames, fetchSpectatableGameActivity } from '@/arkham/api'
import { cullGameLocalStorage } from '@/arkham/localStorage'
import { isDevBuild } from '@/arkham/displayRules'
import { useCardStore } from '@/stores/cards'
import type { BrokenGameDetails, GameDetails } from '@/arkham/types/Game'
import type { EventListEntry } from '@/arkham/types/EpicEvent'

/* The signed-in player's own games and events. The games page lists them and the
 * home page picks up the last one played, so both read them from here. */
export function useMyGames() {
  const cardStore = useCardStore()
  const games: Ref<GameDetails[]> = ref([])
  const brokenGames: Ref<BrokenGameDetails[]> = ref([])
  const events: Ref<EventListEntry[]> = ref([])
  /* False until the games request settles, so a page can hold back "you have no
   * games" until it knows that to be true. */
  const loaded = ref(false)

  /* In the order the server sends them: most recently played first. */
  const activeGames = computed(() => games.value.filter(g => g.gameState.tag !== 'IsOver'))
  const finishedGames = computed(() => games.value.filter(g => g.gameState.tag === 'IsOver'))

  fetchGames().then((result) => {
    const availableGames = result.filter((g) => g.tag === 'game') as GameDetails[]
    cullGameLocalStorage(availableGames)
    games.value = availableGames
    /* One request for every custom investigator on the page, rather than each row
     * buying the whole of its game's card set to read a portrait off it. */
    cardStore.ensureCustomCardPortraits(
      availableGames.flatMap((game) => [
        ...game.investigators.map((investigator) => investigator.id),
        ...Object.values(game.otherInvestigators).map((investigator) => investigator.id),
      ]),
    )
    // Only dev builds get the broken-game rows: in production an unloadable game
    // is noise a player cannot act on beyond deleting it.
    brokenGames.value = isDevBuild() ? (result.filter((g) => g.tag === 'error') as BrokenGameDetails[]) : []
  }).finally(() => loaded.value = true)

  // Epic Multiplayer events surface as a single entry each, inline with regular
  // games (group games are hidden from fetchGames by the backend). A user who is
  // both organizer and player of an event gets duplicate membership rows; collapse
  // to one entry, preferring the organizer role.
  fetchEvents().then((result) => {
    const byId = new Map<string, EventListEntry>()
    for (const entry of result) {
      const existing = byId.get(entry.id)
      if (!existing || entry.role === 'organizer') byId.set(entry.id, entry)
    }
    events.value = [...byId.values()]
  })

  return { games, brokenGames, events, activeGames, finishedGames, loaded }
}

/* How many games are open to spectators right now, for a badge on the way to the
 * watch page. The digest is the ids-only probe that page polls, so this is a
 * handful of uuids rather than a game apiece -- but it is read once on mount and
 * left alone: the number is an invitation to click through, and the page behind
 * it is the one that keeps itself current. A failure just leaves it unbadged. */
export function useLiveGameCount() {
  const liveGameCount = ref(0)
  fetchSpectatableGameActivity()
    .then((activity) => liveGameCount.value = activity.length)
    .catch(() => liveGameCount.value = 0)
  return liveGameCount
}
