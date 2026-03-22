import { defineCollection } from "astro:content"
import { file, glob } from "astro/loaders"
import { z } from "astro/zod"

const projects = defineCollection({
    loader: file("src/content/projects/projects.json"),
    schema: z.object({
        id: z.string(),
        title: z.string(),
        tags: z.array(z.string()),
        description: z.string(),
        links: z.array(z.object({
            label: z.string(),
            href: z.string()
        }
        )),
        contributor: z.string().optional()
    })
})

const blog = defineCollection({
    loader: glob({pattern: "**/*.md", base: "src/content/blog"}),
    schema: z.object({
        title: z.string(),
        date: z.string(),
        excerpt: z.string(),
        coverImage: z.string().optional(),
        series: z.string().optional(),
    })
})

export const collections = { projects, blog }