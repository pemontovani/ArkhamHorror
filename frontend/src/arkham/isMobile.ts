import { ref } from 'vue';

// One media query shared by every caller. A board mounts dozens of cards, so a
// listener per component adds up, and reading the match here means the first
// render is already right.
const query = typeof window === 'undefined' ? null : window.matchMedia('(max-width: 800px)');
const isMobile = ref(query?.matches ?? false);

query?.addEventListener('change', (event) => {
  isMobile.value = event.matches;
});

export function IsMobile() {
  return { isMobile };
}
