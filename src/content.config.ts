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

export const collections = { projects }