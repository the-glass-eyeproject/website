// Predefined tags for the gallery

export const PREDEFINED_TAGS = [
  'Nature',
  'Urban',
  'Portrait',
  'Landscape',
  'Abstract',
  'Architecture',
  'Street',
  'Wildlife',
  'Travel',
  'Black & White',
  'Colour',
  'Minimalist',
  'Documentary',
  'Fine Art',
  'Experimental',
] as const

export type PredefinedTag = typeof PREDEFINED_TAGS[number]

export function isValidTag(tag: string): tag is PredefinedTag {
  return PREDEFINED_TAGS.includes(tag as PredefinedTag)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
