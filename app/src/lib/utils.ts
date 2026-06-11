import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '')
}

const adjectives = [
  'Misty', 'Silent', 'Neon', 'Crimson', 'Frozen', 'Velvet', 'Electric',
  'Cosmic', 'Shadow', 'Solar', 'Lunar', 'Crystal', 'Ember', 'Phantom',
  'Savage', 'Wild', 'Bold', 'Quiet', 'Swift', 'Brave', 'Calm', 'Deep',
  'Fierce', 'Gentle', 'Golden', 'Silver', 'Bronze', 'Ivory', 'Jade',
  'Amber', 'Ruby', 'Sapphire', 'Emerald', 'Onyx', 'Pearl', 'Coral',
  'Stormy', 'Sunny', 'Warm', 'Cool', 'Dark', 'Bright', 'Vivid', 'Pale',
  'Lucky', 'Honest', 'Keen', 'Wise', 'Kind', 'Pure', 'True', 'Soft',
  'Rapid', 'Flash', 'Thunder', 'Blaze', 'Glow', 'Shine', 'Spark',
  'Dawn', 'Dusk', 'Midnight', 'Noon', 'Echo', 'Hollow', 'Secret',
  'Hidden', 'Lost', 'Found', 'Royal', 'Noble', 'Epic', 'Legend',
  'Mythic', 'Candy', 'Sugar', 'Honey', 'Cocoa', 'Mocha', 'Latte',
  'Crisp', 'Fresh', 'Clean', 'Tidy', 'Neat', 'Slick', 'Smooth',
]

const nouns = [
  'Wolf', 'Phoenix', 'Storm', 'Vortex', 'Tiger', 'Falcon', 'Dragon',
  'Hawk', 'Lynx', 'Raven', 'Fox', 'Bear', 'Lion', 'Eagle', 'Otter',
  'Whale', 'Crow', 'Owl', 'Puma', 'Viper', 'Elk', 'Ram', 'Doe',
  'Hare', 'Mole', 'Seal', 'Dove', 'Swan', 'Crane', 'Finch', 'Lark',
  'Wren', 'Heron', 'Kite', 'Hound', 'Mule', 'Oxen', 'Calf', 'Buck',
  'Shark', 'Crab', 'Urchin', 'Clam', 'Scallop', 'Star', 'Moon',
  'Comet', 'Nova', 'Orbit', 'Prism', 'Lens', 'Mirror', 'Shadow',
  'Forest', 'River', 'Lake', 'Ocean', 'Valley', 'Meadow', 'Field',
  'Hill', 'Peak', 'Dune', 'Cave', 'Stone', 'Rock', 'Gem', 'Crown',
  'Throne', 'Shield', 'Sword', 'Arrow', 'Spear', 'Anvil', 'Forge',
  'Blossom', 'Bloom', 'Fern', 'Ivy', 'Rose', 'Lily', 'Iris', 'Palm',
  'Pine', 'Oak', 'Maple', 'Willow', 'Birch', 'Cedar', 'Yew', 'Ash',
]

export function generateHandle(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  return `${adj}${noun}`
}

export function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d`
  return new Date(dateStr).toLocaleDateString()
}
