'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from './src/utils/supabase';
import FeaturedPosts from './components/FeaturedPosts';

export default function Home() {
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalAuthors: 0,
    totalViews: 0
  });

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  const fetchBlogPosts = async () => {
    try {
      setLoading(true);

      // Fetch all blog posts with user information
      const { data: posts, error: postsError } = await supabase
        .from('blog_posts')
        .select(`
          *,
          users (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Get featured posts (latest 6 posts)
      const featured = posts.slice(0, 6);
      setFeaturedPosts(featured);

      // Calculate stats
      const uniqueAuthors = new Set(posts.map(post => post.user_id)).size;
      setStats({
        totalPosts: posts.length,
        totalAuthors: uniqueAuthors,
        totalViews: posts.length * 150 // Simulated views
      });

    } catch (err) {
      console.error('Error fetching blog posts:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Welcome to BlogHub
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Discover amazing stories, insights, and ideas from our community
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/blog"
                className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Explore Blogs
              </Link>
              <Link
                href="/src/register"
                className="px-8 py-3 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 border-2 border-white transition-colors"
              >
                Start Writing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Posts Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Featured Posts</h2>
        <FeaturedPosts posts={featuredPosts} loading={loading} />
      </section>

      {/* Stats Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">
                {loading ? '...' : `${stats.totalPosts}+`}
              </div>
              <div className="text-blue-100">Published Articles</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">
                {loading ? '...' : `${stats.totalAuthors}+`}
              </div>
              <div className="text-blue-100">Active Writers</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">
                {loading ? '...' : `${stats.totalViews}+`}
              </div>
              <div className="text-blue-100">Monthly Readers</div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-12 rounded-xl text-white text-center">
          <h3 className="text-3xl font-bold mb-4">Stay Updated</h3>
          <p className="mb-8 text-blue-100 text-lg max-w-2xl mx-auto">
            Subscribe to our newsletter and never miss a post!
          </p>
          <form className="max-w-md mx-auto flex gap-4">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
