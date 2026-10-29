import { defineField, defineType } from 'sanity'

const layoutImage = defineType({
  name: 'layoutImage',
  title: 'Single Image',
  type: 'image',
  options: { hotspot: true },
  fields: [
    defineField({
      name: 'width',
      title: 'Width (% of page, 20–100)',
      type: 'number',
      initialValue: 100,
      validation: (rule) => rule.min(20).max(100),
    }),
    defineField({ name: 'caption', title: 'Caption (optional)', type: 'string' }),
  ],
})

const imageRow = defineType({
  name: 'imageRow',
  title: 'Image Row (2–3 images side by side)',
  type: 'object',
  fields: [
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [defineField({ name: 'caption', title: 'Caption (optional)', type: 'string' })],
        },
      ],
      validation: (rule) => rule.min(2).max(3),
    }),
  ],
  preview: {
    select: { images: 'images' },
    prepare: ({ images }) => ({ title: `Image row (${images?.length || 0} images)` }),
  },
})

const layoutVideo = defineType({
  name: 'layoutVideo',
  title: 'Video',
  type: 'file',
  options: { accept: 'video/*' },
  fields: [defineField({ name: 'caption', title: 'Caption (optional)', type: 'string' })],
})

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  groups: [
    { name: 'details', title: 'Project details', default: true },
    { name: 'content', title: 'Project content' },
  ],
  fields: [
    defineField({ name: 'title', title: 'Project title', description: 'The project URL is generated from its category and title.', type: 'string', group: 'details', validation: (rule) => rule.required() }),
    defineField({ name: 'category', title: 'Category', type: 'string', group: 'details', options: { list: ['Projects', 'Collaborations', 'Objects', 'Explorations'] }, validation: (rule) => rule.required() }),
    defineField({ name: 'year', title: 'Year', type: 'number', group: 'details', validation: (rule) => rule.integer().min(1900).max(2100) }),
    defineField({ name: 'location', title: 'Location', type: 'string', group: 'details' }),
    defineField({ name: 'summary', title: 'Short description', type: 'text', rows: 3, group: 'details' }),
    defineField({ name: 'featured', title: 'Show on home page', type: 'boolean', initialValue: false, group: 'details' }),
    defineField({ name: 'cover', title: 'Cover image', type: 'image', options: { hotspot: true }, group: 'details' }),
    defineField({
      name: 'content',
      title: 'Project Page Content',
      description: 'Add text, single images, image rows, and videos in order. Drag items to reorder them.',
      type: 'array',
      group: 'content',
      of: [
        { type: 'block' },
        { type: 'layoutImage' },
        { type: 'imageRow' },
        { type: 'layoutVideo' },
      ],
      options: { sortable: true },
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'year', media: 'cover' },
    prepare: ({ title, subtitle, media }) => ({ title, subtitle: subtitle ? String(subtitle) : 'Project', media }),
  },
})

export const projectSchemaTypes = [layoutImage, imageRow, layoutVideo, project]
