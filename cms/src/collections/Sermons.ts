import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'

export const Sermons: CollectionConfig = {
  slug: 'sermons',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'speaker', 'publishDate', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField({ fieldToUse: 'title' }),
    {
      name: 'speaker',
      type: 'text',
      required: true,
    },
    {
      name: 'videoUrl',
      type: 'text',
      label: 'Video URL',
      admin: {
        description: 'YouTube, Vimeo, or direct video URL',
      },
    },
    {
      name: 'audioUrl',
      type: 'text',
      label: 'Audio URL',
      admin: {
        description: 'Direct link to sermon audio file',
      },
    },
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'publishDate',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
  ],
}
