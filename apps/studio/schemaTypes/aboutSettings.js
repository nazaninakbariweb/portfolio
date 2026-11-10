import { defineField, defineType } from 'sanity'

export const aboutSettings = defineType({
  name: 'aboutSettings',
  title: 'About page',
  type: 'document',
  fields: [
    defineField({
      name: 'portrait',
      title: 'About photo',
      description: 'Upload or replace the photo shown on the About page.',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({ name: 'name', title: 'Name', type: 'string' }),
    defineField({ name: 'intro', title: 'Intro paragraph', type: 'text', rows: 3 }),
    defineField({ name: 'biography', title: 'Biography', type: 'text', rows: 6 }),
  ],
  preview: {
    prepare: () => ({ title: 'About page' }),
  },
})
