import { defineField, defineType } from 'sanity'

export const homepageSettings = defineType({
  name: 'homepageSettings',
  title: 'Homepage media',
  type: 'document',
  fields: [
    defineField({
      name: 'heroImages',
      title: 'Homepage slideshow images',
      description: 'Upload exactly 4 images for the first screen slideshow.',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
      validation: (rule) => rule.required().length(4),
    }),
    defineField({
      name: 'heroVideos',
      title: 'Homepage slideshow videos',
      description: 'Upload exactly 3 videos, each 5 seconds long (MP4 or WebM).',
      type: 'array',
      of: [{ type: 'file', options: { accept: 'video/mp4,video/webm' } }],
      validation: (rule) => rule.required().length(3),
    }),
    defineField({
      name: 'collaborationsVideo',
      title: 'Collaborations slide video',
      description: 'Upload a 5-second MP4 or WebM video for the Collaborations category slide.',
      type: 'file',
      options: { accept: 'video/mp4,video/webm' },
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Homepage media' }),
  },
})
