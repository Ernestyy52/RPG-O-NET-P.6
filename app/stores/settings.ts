import { defineStore } from 'pinia'

// ตั้งค่าเกม ใช้ร่วมกันทั้ง title screen และปุ่ม ⚙ ใน HUD — persist ผ่าน localStorage
export const useSettingsStore = defineStore('settings', {
  state: () => ({
    sound: true,
    musicVolume: 0.7,
    sfxVolume: 0.8,
    reducedMotion: false,
    language: 'en' as 'en' | 'th',
  }),
  persist: true,
})
