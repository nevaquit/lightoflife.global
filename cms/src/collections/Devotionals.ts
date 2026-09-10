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
      name: 'type',
      type: 'select',
      defaultValue: 'bulletin',
      options: [
        { label: 'Weekly Bulletin', value: 'bulletin' },
        { label: 'Prayer', value: 'prayer' },
        { label: 'Devotional', value: 'devotional' },
      ],
    },
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
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'externalImageUrl',
      type: 'text',
      label: 'External Image URL',
      admin: {
        description: 'Fallback image URL during migration from WordPress',
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
    {
      name: 'legacyWordPressId',
      type: 'number',
      index: true,
      admin: { readOnly: true, position: 'sidebar' },
    },
  ],
}
