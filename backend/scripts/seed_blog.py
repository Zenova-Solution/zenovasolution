"""Seed default blog posts into the database.

Usage:
    python -m scripts.seed_blog              # insert defaults if missing
    python -m scripts.seed_blog --force      # overwrite existing rows
"""

from __future__ import annotations

import argparse
import asyncio
from datetime import UTC, datetime

from sqlalchemy import select

from app.db import session_scope
from app.models import BlogPost

DEFAULT_POSTS: list[dict] = [
    {
        "slug": "high-converting-landing-page-2025",
        "title": "How to Build a High-Converting Landing Page in 2025",
        "excerpt": "Landing pages are still the highest-leverage asset in digital marketing. Here's a data-driven framework for designing pages that turn visitors into qualified leads.",
        "content_html": (
            "<p>Landing pages are still the highest-leverage asset in digital marketing. "
            "A focused page, paired with the right offer and traffic, can generate leads "
            "and revenue for years with minimal maintenance.</p>"
            "<h2>Start with one clear conversion goal</h2>"
            "<p>Every element on the page should support a single action. Remove navigation, "
            "limit exit links, and make your headline communicate the primary outcome the "
            "visitor will get.</p>"
            "<h2>Lead with value, not features</h2>"
            "<p>Visitors don't care about your process; they care about the result. Translate "
            "features into outcomes: faster time-to-market, more qualified leads, lower "
            "customer-acquisition cost.</p>"
            "<h2>Social proof removes friction</h2>"
            "<p>Add testimonials, logos, case-study results, and trust badges near your call "
            "to action. People are far more likely to convert when they see others like them "
            "have already succeeded.</p>"
            "<h2>Continuous testing beats one-time redesigns</h2>"
            "<p>The best landing pages are never finished. Run A/B tests on headlines, offers, "
            "and form length every month. Small improvements compound into massive conversion "
            "gains over time.</p>"
        ),
        "cover_image_url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
        "author_name": "Zenova Team",
        "tags": ["conversion", "landing pages", "lead generation", "cro"],
        "status": "published",
        "published_at": datetime.now(UTC),
        "meta_title": "How to Build a High-Converting Landing Page in 2025 | Zenova",
        "meta_description": "A practical framework for designing landing pages that turn traffic into qualified leads and customers.",
        "og_image_url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "slug": "seo-guide-service-businesses",
        "title": "The Complete Guide to SEO for Service Businesses",
        "excerpt": "Service businesses don't need viral content. They need authority, local relevance, and pages that match how clients actually search.",
        "content_html": (
            "<p>Service businesses don't need viral content. They need authority, local "
            "relevance, and pages that match how clients actually search.</p>"
            "<h2>Build service pages around search intent</h2>"
            "<p>Create a dedicated page for each service you offer. Optimize the page title, "
            "headings, and body copy around the exact phrases your prospects use when they "
            "need help.</p>"
            "<h2>Local SEO is non-negotiable</h2>"
            "<p>Claim and optimize your Google Business Profile, keep your NAP consistent "
            "across directories, and actively collect reviews. Local signals often determine "
            "whether you appear in the map pack.</p>"
            "<h2>Demonstrate expertise with case studies</h2>"
            "<p>Search engines and buyers both reward depth. Publish detailed case studies "
            "that explain the challenge, your approach, and the measurable results you "
            "delivered.</p>"
            "<h2>Technical fundamentals matter</h2>"
            "<p>Fast load times, mobile usability, clean URLs, and proper schema markup make "
            "it easier for search engines to crawl and rank your site.</p>"
        ),
        "cover_image_url": "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&w=1200&q=80",
        "author_name": "Zenova Team",
        "tags": ["seo", "local seo", "service business", "organic growth"],
        "status": "published",
        "published_at": datetime.now(UTC),
        "meta_title": "SEO Guide for Service Businesses | Zenova",
        "meta_description": "Learn how service businesses can attract qualified leads through search intent, local SEO, and authoritative content.",
        "og_image_url": "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "slug": "brand-story-matters",
        "title": "Why Your Brand Story Matters More Than Your Product",
        "excerpt": "In crowded markets, features get copied. The story behind why you exist is what creates loyalty, differentiation, and long-term growth.",
        "content_html": (
            "<p>In crowded markets, features get copied. The story behind why you exist is "
            "what creates loyalty, differentiation, and long-term growth.</p>"
            "<h2>People buy meaning, not specifications</h2>"
            "<p>Your product may be faster or cheaper, but a competitor can match that. What "
            "they can't copy is the emotional connection you build through a clear, authentic "
            "brand narrative.</p>"
            "<h2>Define the villain and the vision</h2>"
            "<p>Every strong story has tension. Identify the problem your audience faces, show "
            "that you understand it deeply, and position your brand as the guide that helps "
            "them win.</p>"
            "<h2>Consistency builds recognition</h2>"
            "<p>Your story should show up everywhere: your website copy, your emails, your "
            "social posts, and your sales calls. Consistency turns a message into a memory.</p>"
            "<h2>Let customers become characters</h2>"
            "<p>The best brand stories make the customer the hero. Share their wins, quote "
            "their words, and build your narrative around the transformation you help create.</p>"
        ),
        "cover_image_url": "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
        "author_name": "Zenova Team",
        "tags": ["branding", "storytelling", "positioning", "growth"],
        "status": "published",
        "published_at": datetime.now(UTC),
        "meta_title": "Why Your Brand Story Matters More Than Your Product | Zenova",
        "meta_description": "Discover how a clear brand story drives differentiation, loyalty, and long-term growth in competitive markets.",
        "og_image_url": "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
    },
]


async def seed_blog(force: bool) -> None:
    async with session_scope() as db:
        existing_slugs = {
            row.slug for row in (await db.execute(select(BlogPost))).scalars()
        }

        for post in DEFAULT_POSTS:
            if post["slug"] in existing_slugs and not force:
                print(f"Skipping existing blog post: {post['slug']}")
                continue

            if force and post["slug"] in existing_slugs:
                row = await db.get(BlogPost, post["slug"])
                assert row is not None
                for key, value in post.items():
                    setattr(row, key, value)
            else:
                db.add(BlogPost(**post))

        print(f"Seeded {len(DEFAULT_POSTS)} default blog posts.")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="Overwrite existing rows.")
    args = parser.parse_args()
    asyncio.run(seed_blog(args.force))


if __name__ == "__main__":
    main()
