<script lang="ts" setup>
import { computed, ref, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { fetchNotifications } from '@/arkham/api';
import type { AppNotification } from '@/arkham/api';
import { useLiveGameCount, useMyGames } from '@/arkham/composables/useMyGames';
import GameRow from '@/arkham/components/GameRow.vue';
import AnnouncementFeed from '@/arkham/components/AnnouncementFeed.vue';
import KeyArt from '@/components/KeyArt.vue';
import logo from '@/assets/art/logo.webp';

/* The way in: pick up the last game played, or go somewhere else. The full list
 * of games is a page of its own. */
const { t } = useI18n()
const { activeGames, events, loaded } = useMyGames()
const liveGameCount = useLiveGameCount()

const notifications: Ref<AppNotification[]> = ref([])
fetchNotifications().then((result) => notifications.value = result)

/* Whether the right-hand column exists at all. Announcements are the only thing
 * in it today, so with none left the panel takes the whole width back rather
 * than leaving an empty gutter; a second panel ORs into this. */
const hasFeed = computed(() => notifications.value.length > 0)

/* The server lists games by last activity, so the first one still in play is the
 * one the player was last at. */
const lastGame = computed(() => activeGames.value[0] ?? null)
const lastGamePath = computed(() => {
  const game = lastGame.value
  if (!game) return null
  return game.hasOpenSeats ? `/games/${game.id}/claim-seat` : `/games/${game.id}`
})

const activeCount = computed(() => activeGames.value.length + events.value.length)

const shortcuts = computed(() => [
  { to: '/new-game', icon: 'plus', label: t('newGame') },
  {
    to: '/games',
    icon: 'list',
    label: t('nav.games'),
    count: activeCount.value,
    countLabel: t('home.activeCount', { count: activeCount.value }),
  },
  { to: '/decks', icon: 'layer-group', label: t('nav.myDecks') },
  { to: '/cards', icon: 'image', label: t('nav.cards') },
  {
    to: '/watch',
    icon: 'eye',
    label: t('pageTitles.watch'),
    count: liveGameCount.value,
    countLabel: t('home.watchGamesAvailable', { count: liveGameCount.value }, { plural: liveGameCount.value }),
  },
])
</script>

<template>
  <div class="page-container">
    <div class="home page-content" :class="{ 'has-feed': hasFeed }">
      <header class="hero">
        <KeyArt class="hero-art" />
        <img class="hero-logo" :src="logo" alt="Arkham Horror: The Card Game" />
      </header>

      <!-- Ahead of the main column in the document, as the banners were -- a
           reader hears the news first, whichever column it is drawn in. -->
      <aside v-if="hasFeed" class="home-feed" :aria-label="$t('home.feedLabel')">
        <AnnouncementFeed :notifications="notifications" />
      </aside>

      <div class="home-main">
        <nav :aria-label="$t('home.quickAccess')">
          <h2>{{ $t('home.quickAccess') }}</h2>
          <div class="shortcuts">
            <RouterLink v-for="shortcut in shortcuts" :key="shortcut.to" class="shortcut" :to="shortcut.to">
              <font-awesome-icon class="shortcut-icon" :icon="shortcut.icon" />
              <span>{{ shortcut.label }}</span>
              <span v-if="shortcut.count" class="shortcut-count" :aria-label="shortcut.countLabel">
                {{ shortcut.count }}
              </span>
            </RouterLink>
          </div>
        </nav>

        <section>
          <h2>{{ $t('home.continuePlaying') }}</h2>
          <template v-if="lastGame && lastGamePath">
            <GameRow :key="lastGame.id" :game="lastGame" />
            <RouterLink class="continue-cta" :to="lastGamePath">
              {{ $t('home.continue') }}
              <font-awesome-icon icon="chevron-right" />
            </RouterLink>
          </template>
          <div v-else-if="loaded" class="box">
            <p>{{ $t('home.noActiveGames') }}</p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home {
  /* A minimum the feed is never squeezed below, and a ceiling so that on a
     very wide screen it stays a column of news rather than a second page. */
  --feed-width: clamp(300px, 22vw, 420px);
  width: 94vw;
  margin: 0 auto;
  /* One column until there is a feed, so with nothing to announce the panel
     takes the whole width back. */
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  /* Each column is as tall as its own contents: the feed must not stretch to
     the height of the other one, or it cannot stick. */
  align-items: start;
  gap: 20px;
  @media (max-width: 768px) {
    width: 100%;
    padding: 20px 12px 10px;
    box-sizing: border-box;
  }
}

.hero {
  /* Across both columns, and first however the rest are ordered. */
  grid-column: 1 / -1;
  order: -1;
  position: relative;
  height: clamp(180px, 24vw, 340px);
  overflow: hidden;
  border: 1px solid var(--box-border);
  border-radius: 8px;

  @media (max-width: 768px) {
    height: auto;
    aspect-ratio: 16 / 10;
  }
}

.hero-art {
  --art-position: center 42%;
  position: absolute;
  inset: 0;
}

.hero-logo {
  position: absolute;
  left: clamp(12px, 3vw, 48px);
  bottom: clamp(12px, 2vw, 28px);
  width: clamp(150px, 17vw, 270px);
  height: auto;
  filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.7));

  /* The phone crop has the investigator on the left, so the logo changes side. */
  @media (max-width: 768px) {
    left: auto;
    right: 10px;
    bottom: 10px;
    width: 40%;
  }
}

.home.has-feed {
  grid-template-columns: minmax(0, 1fr) var(--feed-width);
}

.home-feed {
  display: flex;
  flex-direction: column;
  gap: 12px;
  /* Second column, though it comes first in the document. */
  order: 1;
  /* Reading an announcement should not mean losing your place on the page. */
  position: sticky;
  top: 0;
  max-height: calc(100dvh - var(--nav-height) - 40px);
  overflow-y: auto;
}

/* Below this the two columns no longer both fit, and the feed goes back to
   where the banners were: above everything, where it is read on the way past. */
@media (max-width: 1024px) {
  .home.has-feed {
    grid-template-columns: minmax(0, 1fr);
  }

  .home-feed {
    order: 0;
    position: static;
    max-height: none;
    overflow-y: visible;
  }
}

.home-main {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

h2 {
  color: var(--title);
  font-size: 2em;
  text-transform: uppercase;
  font-family: teutonic, sans-serif;
  margin: 0 0 10px;
  @media (max-width: 768px) {
    font-size: 1.5em;
  }
}

p {
  margin: 0;
  padding: 0;
}

.box {
  background-color: var(--box-background);
  border: 1px solid var(--box-border);
  color: var(--title);
  padding: 10px;
  border-radius: 5px;
}

.continue-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: var(--button-1);
  border-radius: 3px;
  color: white;
  font-weight: bolder;
  padding: 10px 15px;
  text-decoration: none;
  text-transform: uppercase;
  transition: background-color 0.3s linear;

  &:hover {
    background: hsl(80, 35%, 32%);
  }
}

.shortcuts {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
  @media (max-width: 480px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.shortcut {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 110px;
  padding: 14px;
  background-color: var(--box-background);
  border: 1px solid var(--box-border);
  border-radius: 5px;
  color: var(--title);
  font-weight: 700;
  text-align: center;
  text-decoration: none;
  text-transform: uppercase;
  transition: border-color 0.15s, color 0.15s;

  &:hover {
    border-color: var(--spooky-green);
    color: var(--spooky-green);
  }
}

.shortcut-icon {
  font-size: 1.8em;
}

.shortcut-count {
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--background-dark);
  border-radius: 999px;
  color: var(--title);
  font-size: 0.8em;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  min-width: 1.6em;
  padding: 4px 6px;
}
</style>
