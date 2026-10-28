import { defineField, defineType } from 'sanity'

const layoutFields = [
  defineField({
    name: 'width',
    title: 'Desktop width (grid columns)',
    type: 'number',
    initialValue: 12,
    validation: (rule) => rule.min(1).max(12).integer(),
  }),
  defineField({
    name: 'offset',
    title: 'Left offset (grid columns)',
    type: 'number',
    initialValue: 0,
    validation: (rule) => rule.min(0).max(11).integer(),
  }),
  defineField({
    name: 'mobileWidth',
    title: 'Mobile width',
    type: 'string',
    initialValue: 'full',
    options: {
      layout: 'radio',
      list: [
        { title: 'Full width', value: 'full' },
        { title: 'Half width', value: 'half' },
      ],
    },
  }),
]

const layoutObject = defineType({
  name: 'blockLayout',
  title: 'Layout',
  type: 'object',
  fields: layoutFields,
})

const projectImage = defineType({
  name: 'projectImage',
  title: 'Image or render',
  type: 'object',
  fields: [
    defineField({ name: 'image', title: 'Image', type: 'image', options: { hotspot: true }, validation: (rule) => rule.required() }),
    defineField({ name: 'alt', title: 'Image description', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'caption', title: 'Caption', type: 'string' }),
    defineField({ name: 'layout', title: 'Layout', type: 'blockLayout', initialValue: { width: 12, offset: 0, mobileWidth: 'full' } }),
  ],
  preview: { select: { title: 'caption', media: 'image' }, prepare: ({ title, media }) => ({ title: title || 'Image or render', media }) },
})

const projectDrawing = defineType({
  name: 'projectDrawing',
  title: 'Plan, section, or diagram',
  type: 'object',
  fields: [
    defineField({ name: 'title', title: 'Drawing title', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'file', title: 'Drawing file or image', type: 'file' }),
    defineField({ name: 'image', title: 'Drawing image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'alt', title: 'Description', type: 'string' }),
    defineField({ name: 'layout', title: 'Layout', type: 'blockLayout', initialValue: { width: 6, offset: 0, mobileWidth: 'full' } }),
  ],
  preview: { select: { title: 'title', media: 'image' } },
})

const projectVideo = defineType({
  name: 'projectVideo',
  title: 'Video',
  type: 'object',
  fields: [
    defineField({ name: 'title', title: 'Video title', type: 'string' }),
    defineField({ name: 'url', title: 'Video URL', type: 'url' }),
    defineField({ name: 'file', title: 'Video file', type: 'file', options: { accept: 'video/mp4,video/webm' } }),
    defineField({ name: 'layout', title: 'Layout', type: 'blockLayout', initialValue: { width: 12, offset: 0, mobileWidth: 'full' } }),
  ],
  preview: { select: { title: 'title' }, prepare: ({ title }) => ({ title: title || 'Video' }) },
})

const projectText = defineType({
  name: 'projectText',
  title: 'Text',
  type: 'object',
  fields: [
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    defineField({ name: 'body', title: 'Text', type: 'text', rows: 5, validation: (rule) => rule.required() }),
    defineField({ name: 'layout', title: 'Layout', type: 'blockLayout', initialValue: { width: 6, offset: 0, mobileWidth: 'full' } }),
  ],
  preview: { select: { title: 'heading' }, prepare: ({ title }) => ({ title: title || 'Text' }) },
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
    defineField({ name: 'title', title: 'Project title', type: 'string', group: 'details', validation: (rule) => rule.required() }),
    defineField({ name: 'slug', title: 'Web address', type: 'slug', group: 'details', options: { source: 'title', maxLength: 96 }, validation: (rule) => rule.required() }),
    defineField({ name: 'category', title: 'Category', type: 'string', group: 'details', options: { list: ['Architecture', 'Interior', 'Installation', 'Research'] } }),
    defineField({ name: 'year', title: 'Year', type: 'number', group: 'details', validation: (rule) => rule.integer().min(1900).max(2100) }),
    defineField({ name: 'location', title: 'Location', type: 'string', group: 'details' }),
    defineField({ name: 'summary', title: 'Short description', type: 'text', rows: 3, group: 'details' }),
    defineField({ name: 'featured', title: 'Show on home page', type: 'boolean', initialValue: false, group: 'details' }),
    defineField({ name: 'cover', title: 'Cover image', type: 'image', options: { hotspot: true }, group: 'details' }),
    defineField({
      name: 'content',
      title: 'Project story and media',
      type: 'array',
      group: 'content',
      of: [
        { type: 'projectImage' },
        { type: 'projectDrawing' },
        { type: 'projectVideo' },
        { type: 'projectText' },
      ],
      options: { sortable: true },
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'year', media: 'cover' },
    prepare: ({ title, subtitle, media }) => ({ title, subtitle: subtitle ? String(subtitle) : 'Project', media }),
  },
})

export const projectSchemaTypes = [layoutObject, projectImage, projectDrawing, projectVideo, projectText, project]
