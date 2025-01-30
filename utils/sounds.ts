export const playSound = (type: 'correct' | 'incorrect') => {
  const audio = new Audio(`/${type}.mp3`)
  audio.play().catch(err => console.log('Audio playback failed:', err))
} 