export const AUDIO_ASSETS = {
  bgm: require('../../assets/audio/sfx/bgm/mongle_bgm_v3_light_loop.wav'),
  hits: {
    MISS: require('../../assets/audio/sfx/hits/hit_miss.wav'),
    GOOD: require('../../assets/audio/sfx/hits/hit_good.wav'),
    GREAT: require('../../assets/audio/sfx/hits/hit_great.wav'),
    EXCELLENT: require('../../assets/audio/sfx/hits/hit_excellent.wav'),
    PERFECT: require('../../assets/audio/sfx/hits/hit_perfect.wav'),
    EXACT: require('../../assets/audio/sfx/hits/hit_exact.wav'),
  },
  eggHatch: {
    crackLight: require('../../assets/audio/sfx/egg-hatch/egg_crack_light.wav'),
    crackHeavy: require('../../assets/audio/sfx/egg-hatch/egg_crack_heavy.wav'),
    eggBreak: require('../../assets/audio/sfx/egg-hatch/egg_break.wav'),
    hatchRise: require('../../assets/audio/sfx/egg-hatch/hatch_rise.wav'),
    collectionNew: require('../../assets/audio/sfx/egg-hatch/collection_new.wav'),
    collectionDuplicate: require('../../assets/audio/sfx/egg-hatch/collection_duplicate.wav'),
  },
  misc: {
    countdown3: require('../../assets/audio/sfx/misc/countdown_3.wav'),
    countdown2: require('../../assets/audio/sfx/misc/countdown_2.wav'),
    countdown1: require('../../assets/audio/sfx/misc/countdown_1.wav'),
    countdownGo: require('../../assets/audio/sfx/misc/countdown_go.wav'),
    uiClick: require('../../assets/audio/sfx/misc/ui_button_click_soft_v2.wav'),
  },
} as const;
