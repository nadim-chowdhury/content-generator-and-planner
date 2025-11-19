"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { blogApi, BlogPost } from "@/lib/blog";
import Navbar from "@/components/Navbar";

export default function BlogPostPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (slug) {
      loadPost();
    }
  }, [slug]);

  const loadPost = async () => {
    try {
      setLoading(true);
      setError("");
      const postData = await blogApi.getPostBySlug(slug);
      setPost(postData);
    } catch (err: any) {
      setError(err.response?.data?.message || "Post not found");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Loading post...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Post Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {error || "The blog post you are looking for does not exist."}
            </p>
            <a
              href="/blog"
              className="mt-4 inline-block text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
            >
              Back to Blog
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <header className="mb-8">
          {post.category && (
            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              {post.category}
            </span>
          )}
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mt-2 mb-4">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
              {post.excerpt}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              {post.author.profileImage ? (
                <img
                  src={post.author.profileImage}
                  alt={post.author.name || "Author"}
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-gray-500 dark:text-gray-400">
                    {post.author.name?.charAt(0) || "A"}
                  </span>
                </div>
              )}
              <span>{post.author.name || "Anonymous"}</span>
            </div>
            <span>•</span>
            <span>{formatDate(post.publishedAt || post.createdAt)}</span>
            <span>•</span>
            <span>{post.views} views</span>
          </div>
        </header>

        {/* Featured Image */}
        {post.featuredImage && (
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-96 object-cover rounded-lg mb-8"
          />
        )}

        {/* Content */}
        <div
          className="prose prose-lg dark:prose-invert max-w-none mb-8"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Back to Blog */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <a
            href="/blog"
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
          >
            ← Back to Blog
          </a>
        </div>
      </article>
    </div>
  );
}
