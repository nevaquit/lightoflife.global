import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'

export const Causes: CollectionConfig = {
  slug: 'causes',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'donationGoal', 'currentRaised', 'updatedAt'],
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
      name: 'description',
      type: 'richText',
      required: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'donationGoal',
      type: 'number',
      min: 0,
      defaultValue: 0,
      admin: {
        description: 'Target fundraising amount in USD',
      },
    },
    {
      name: 'currentRaised',
      type: 'number',
      min: 0,
      defaultValue: 0,
      admin: {
        description: 'Amount raised so far in USD',
      },
    },
    {
      name: 'externalImageUrl',
      type: 'text',
      label: 'External Image URL',
    },
    {
      name: 'legacyWordPressId',
      type: 'number',
      index: true,
      admin: { readOnly: true, position: 'sidebar' },
    },
  ],
}
