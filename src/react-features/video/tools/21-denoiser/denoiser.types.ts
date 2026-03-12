export interface DenoiserOptions {
  strength: number; // 1 to 10
  method: 'hqdn3d' | 'nlmeans';
}
