import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'

export const Devotionals: CollectionConfig = {
  slug: 'devotionals',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'scriptureReference', 'publishDate', 'updatedAt'],
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
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      name: 'scriptureReference',
      type: 'text',
      label: 'Scripture Reference',
      admin: {
        description: 'e.g. John 3:16, Psalm 23:1-6',
      },
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
