import siteContent from '../data/site-content.json'

export type NavItem = {
  label: string
  href: string
  children?: NavItem[]
}

export type FaqItem = {
  question: string
  answer: string
}

export type TeamMember = {
  name: string
  slug: string
  bio: string
  imageUrl: string | null
}

export type SiteContent = {
  navigation: NavItem[]
  footer: {
    tagline: string
    aboutText: string
    quickLinks: NavItem[]
    social: NavItem[]
    newsletter: { title: string; description: string }
  }
  podcast: {
    title: string
    subtitle: string
    embedUrl: string
    platforms: NavItem[]
  }
  pillarImages: {
    devotional: string
    sermon: string
    cause: string
  }
  faq: FaqItem[]
  pages: {
    about: { title: string; sections: string[] }
    ministry: { title: string; sections: string[] }
    contact: { title: string; email: string }
  }
  team: TeamMember[]
}

export const site = siteContent as SiteContent
