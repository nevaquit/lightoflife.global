import type { GlobalConfig } from 'payload'

export const Homepage: GlobalConfig = {
  slug: 'homepage',
  label: 'Homepage Layout',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'layout',
      type: 'blocks',
      required: true,
      blocks: [
        {
          slug: 'hero',
          labels: {
            singular: 'Hero',
            plural: 'Hero Sections',
          },
          fields: [
            {
              name: 'eyebrow',
              type: 'text',
              label: 'Eyebrow Text',
            },
            {
              name: 'headline',
              type: 'text',
              required: true,
            },
            {
              name: 'subheadline',
              type: 'textarea',
            },
            {
              name: 'backgroundImage',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'primaryCta',
              type: 'group',
              fields: [
                { name: 'label', type: 'text', required: true },
                { name: 'url', type: 'text', required: true },
              ],
            },
            {
              name: 'secondaryCta',
              type: 'group',
              fields: [
                { name: 'label', type: 'text' },
                { name: 'url', type: 'text' },
              ],
            },
          ],
        },
        {
          slug: 'mediaGrid',
          labels: {
            singular: 'Media Grid',
            plural: 'Media Grids',
          },
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            {
              name: 'subtitle',
              type: 'textarea',
            },
            {
              name: 'items',
              type: 'array',
              minRows: 1,
              maxRows: 12,
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                },
                { name: 'title', type: 'text', required: true },
                { name: 'url', type: 'text' },
                {
                  name: 'contentType',
                  type: 'select',
                  options: [
                    { label: 'Sermon', value: 'sermon' },
                    { label: 'Devotional', value: 'devotional' },
                    { label: 'Cause', value: 'cause' },
                    { label: 'External Link', value: 'external' },
                  ],
                  defaultValue: 'external',
                },
              ],
            },
          ],
        },
        {
          slug: 'featuredSermons',
          labels: {
            singular: 'Featured Sermons',
            plural: 'Featured Sermons Sections',
          },
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              defaultValue: 'Latest Sermons',
            },
            {
              name: 'sermons',
              type: 'relationship',
              relationTo: 'sermons',
              hasMany: true,
              maxRows: 6,
            },
          ],
        },
        {
          slug: 'featuredCauses',
          labels: {
            singular: 'Featured Causes',
            plural: 'Featured Causes Sections',
          },
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              defaultValue: 'Support Our Mission',
            },
            {
              name: 'causes',
              type: 'relationship',
              relationTo: 'causes',
              hasMany: true,
              maxRows: 4,
            },
          ],
        },
        {
          slug: 'ctaBanner',
          labels: {
            singular: 'CTA Banner',
            plural: 'CTA Banners',
          },
          fields: [
            {
              name: 'headline',
              type: 'text',
              required: true,
            },
            {
              name: 'body',
              type: 'textarea',
            },
            {
              name: 'buttonLabel',
              type: 'text',
              required: true,
            },
            {
              name: 'buttonUrl',
              type: 'text',
              required: true,
            },
          ],
        },
      ],
    },
  ],
}
