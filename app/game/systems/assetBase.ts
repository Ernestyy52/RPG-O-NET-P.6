// เว็บอาจ deploy อยู่ใต้ subpath (เช่น GitHub Pages /RPG-O-NET-P.6/) จึงต้องเติม base URL
// ให้ path ของไฟล์ asset แทนการใช้ path แบบ absolute ตรงๆ ('/...') ซึ่งจะชี้ไปที่ root โดเมนเสมอ
// ค่า base มาจาก Nuxt app.baseURL ที่ส่งต่อมาจาก GameCanvas.client.vue (useRuntimeConfig)
// โมดูลนี้แยกจาก textures.ts เพื่อให้ store/test import ได้โดยไม่ลาก Phaser เข้ามา
let assetBase = '/'
export function setAssetBase(base: string) {
  assetBase = base.endsWith('/') ? base : `${base}/`
}
export function assetPath(path: string): string {
  return `${assetBase}${path}`.replace(/\/{2,}/g, '/')
}
