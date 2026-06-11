export interface IChannelDef {
  slug: string
  name: string
  description: string
  icon: string
}

export const CHANNELS: IChannelDef[] = [
  { slug: 'advice', name: 'Advice', description: 'Seek and give advice', icon: '💡' },
  { slug: 'confessions', name: 'Confessions', description: 'Get it off your chest', icon: '🤫' },
  { slug: 'wins', name: 'Wins', description: 'Share your victories', icon: '🏆' },
  { slug: 'rants', name: 'Rants', description: 'Vent about anything', icon: '😤' },
  { slug: 'daily', name: 'Daily', description: 'Your day, your way', icon: '📆' },
  { slug: 'offtopic', name: 'Off Topic', description: 'Everything else', icon: '🌀' },
]
