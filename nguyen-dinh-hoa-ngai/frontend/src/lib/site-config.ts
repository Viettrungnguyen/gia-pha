/**
 * @project NguyenDinhHoaNgai
 * @file src/lib/site-config.ts
 * @description Site metadata
 * @version 1.0.0
 * @updated 2026-07-23
 */

export const SITE_CONFIG = {
  name: 'Dòng họ Nguyễn Đình',
  shortName: 'Nguyễn Đình',
  description: 'Gia phả điện tử - Dòng họ Nguyễn Đình làng Hòa Ngãi, xã Thanh Hà, huyện Thanh Liêm, tỉnh Hà Nam',
  location: {
    village: 'Làng Hòa Ngãi',
    commune: 'Xã Thanh Hà',
    district: 'Huyện Thanh Liêm',
    province: 'Tỉnh Hà Nam',
  },
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://giapha-nguyen-dinh-hoa-ngai.vercel.app',
  locale: 'vi_VN',
  foundingYear: 1850,
} as const;
