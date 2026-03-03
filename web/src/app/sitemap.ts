import type { MetadataRoute } from "next";

const BASE_URL = "https://www.forkscout.com";

const sections = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/#features", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/#use-cases", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/#tech-stack", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/#providers", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/#get-started", priority: 0.8, changeFrequency: "monthly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
    return sections.map((s) => ({
        url: `${BASE_URL}${s.path}`,
        lastModified: new Date(),
        changeFrequency: s.changeFrequency,
        priority: s.priority,
    }));
}
