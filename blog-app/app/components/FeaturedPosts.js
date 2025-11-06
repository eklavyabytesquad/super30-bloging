'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../src/utils/supabase';

export default function FeaturedPosts({ posts, loading }) {
  const [interactions, setInteractions] = useState({});
  const [showCommentBox, setShowCommentBox] = useState({});
  const [commentData, setCommentData] = useState({});
  const [submitting, setSubmitting] = useState({});

  useEffect(() => {
    if (posts.length > 0) {
      fetchInteractions();
    }
  }, [posts]);

  const fetchInteractions = async () => {
    try {
      const blogIds = posts.map(post => post.id);

      const { data, error } = await supabase
        .from('interactions')
        .select('*')
        .in('blog_id', blogIds);

      if (error) throw error;

      const groupedInteractions = {};
      data.forEach(interaction => {
        if (!groupedInteractions[interaction.blog_id]) {
          groupedInteractions[interaction.blog_id] = {
            likes: 0,
            comments: []
          };
        }
        if (interaction.is_liked) {
          groupedInteractions[interaction.blog_id].likes++;
        }
        if (interaction.comment_text) {
          groupedInteractions[interaction.blog_id].comments.push(interaction);
        }
      });

      setInteractions(groupedInteractions);
    } catch (err) {
      console.error('Error fetching interactions:', err);
    }
  };

  const handleLike = async (blogId) => {
    try {
      const { error } = await supabase
        .from('interactions')
        .insert([
          {
            blog_id: blogId,
            is_liked: true
          }
        ]);

      if (error) throw error;

      setInteractions(prev => ({
        ...prev,
        [blogId]: {
          likes: (prev[blogId]?.likes || 0) + 1,
          comments: prev[blogId]?.comments || []
        }
      }));
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleCommentSubmit = async (blogId) => {
    if (!commentData[blogId]?.name || !commentData[blogId]?.comment) {
      alert('Please fill in both name and comment');
      return;
    }

    try {
      setSubmitting(prev => ({ ...prev, [blogId]: true }));

      const { data, error } = await supabase
        .from('interactions')
        .insert([
          {
            blog_id: blogId,
            name: commentData[blogId].name,
            comment_text: commentData[blogId].comment,
            is_liked: false
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setInteractions(prev => ({
        ...prev,
        [blogId]: {
          likes: prev[blogId]?.likes || 0,
          comments: [...(prev[blogId]?.comments || []), data]
        }
      }));

      setCommentData(prev => ({ ...prev, [blogId]: { name: '', comment: '' } }));
      setShowCommentBox(prev => ({ ...prev, [blogId]: false }));
    } catch (err) {
      console.error('Error submitting comment:', err);
      alert('Failed to submit comment. Please try again.');
    } finally {
      setSubmitting(prev => ({ ...prev, [blogId]: false }));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getFirstTag = (reference) => {
    if (reference && reference.tags && reference.tags.length > 0) {
      return reference.tags[0];
    }
    return 'Blog';
  };

  if (loading) {
    return (
      <div className="relative flex justify-center">
        <div className="absolute inset-0 -z-10 h-56 max-w-xl rounded-full bg-blue-500/20 blur-3xl"></div>
        <div className="flex justify-center items-center py-20">
          <svg className="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-blue-100/60 bg-white/80 p-12 text-center shadow-xl shadow-blue-100/40 backdrop-blur">
        <div className="absolute inset-0 -z-10 bg-linear-to-br from-blue-500/10 via-sky-400/10 to-indigo-500/10"></div>
        <div className="absolute -top-12 -right-16 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl"></div>
        <div className="absolute -bottom-12 -left-16 h-48 w-48 rounded-full bg-sky-400/20 blur-3xl"></div>
        <svg className="mx-auto mb-6 h-20 w-20 text-blue-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="text-3xl font-bold text-gray-900">No posts yet</h3>
        <p className="mt-2 text-base text-blue-900/70">Be the voice that starts the conversation. Share your first story with the community.</p>
        <Link
          href="/src/register"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-linear-to-r from-blue-600 via-sky-500 to-indigo-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:shadow-xl hover:-translate-y-0.5"
        >
          Start Writing
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <article
            key={post.id}
            className="group relative overflow-hidden rounded-3xl border border-blue-100/50 bg-white/90 shadow-xl shadow-blue-100/40 backdrop-blur transition hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="absolute inset-0 -z-10 bg-linear-to-br from-blue-500/10 via-sky-400/10 to-indigo-500/10 opacity-0 transition duration-500 group-hover:opacity-100"></div>
            <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-blue-500 via-sky-400 to-indigo-500"></div>

            {post.image_base64 ? (
              <div className="relative h-48 overflow-hidden">
                <img
                  src={post.image_base64}
                  alt={post.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-linear-to-b from-transparent via-blue-900/10 to-blue-900/40"></div>
                <div className="absolute right-4 top-4">
                  <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700 shadow-md">
                    {getFirstTag(post.reference)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="relative h-48 bg-linear-to-br from-blue-500 via-sky-400 to-indigo-500">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_60%)]"></div>
                <div className="absolute right-4 top-4">
                  <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700 shadow-md">
                    {getFirstTag(post.reference)}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 text-white/90">
                  <span className="text-sm font-medium">Featured Story</span>
                  <p className="text-lg font-semibold">{post.title}</p>
                </div>
              </div>
            )}

            <div className="space-y-4 p-6">
              {post.sub_title && (
                <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
                  {post.sub_title}
                </span>
              )}
              <h3 className="text-xl font-bold text-gray-900 transition group-hover:text-blue-700">
                <Link href={`/blog/${post.id}`}>{post.title}</Link>
              </h3>
              <p className="text-sm leading-relaxed text-gray-600 line-clamp-3">
                {truncateText(post.description, 140)}
              </p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                    {(post.users?.full_name || 'A')[0]?.toUpperCase() || 'A'}
                  </span>
                  <span className="font-medium text-gray-900">{post.users?.full_name || 'Anonymous'}</span>
                </span>
                <span>{formatDate(post.created_at)}</span>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 transition group-hover:border-blue-200 group-hover:bg-blue-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLike(post.id)}
                      className="flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm shadow-blue-100 transition hover:bg-linear-to-r hover:from-blue-600 hover:to-indigo-500 hover:text-white"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                      {interactions[post.id]?.likes || 0}
                    </button>
                    <button
                      onClick={() => setShowCommentBox(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                      className="flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm shadow-blue-100 transition hover:bg-linear-to-r hover:from-blue-600 hover:to-indigo-500 hover:text-white"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {interactions[post.id]?.comments?.length || 0}
                    </button>
                  </div>
                  <Link
                    href={`/blog/${post.id}`}
                    className="inline-flex items-center gap-2 rounded-full bg-white/0 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-white/80"
                  >
                    Read More
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>

                {showCommentBox[post.id] && (
                  <div className="mt-4 space-y-3 rounded-2xl bg-white/80 p-4 shadow-sm shadow-blue-100">
                    <input
                      type="text"
                      placeholder="Your name"
                      value={commentData[post.id]?.name || ''}
                      onChange={(e) => setCommentData(prev => ({
                        ...prev,
                        [post.id]: { ...prev[post.id], name: e.target.value }
                      }))}
                      className="w-full rounded-xl border border-blue-100/70 bg-white/70 px-4 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                    />
                    <textarea
                      placeholder="Share your thoughts..."
                      value={commentData[post.id]?.comment || ''}
                      onChange={(e) => setCommentData(prev => ({
                        ...prev,
                        [post.id]: { ...prev[post.id], comment: e.target.value }
                      }))}
                      rows={3}
                      className="w-full resize-none rounded-xl border border-blue-100/70 bg-white/70 px-4 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                    />
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleCommentSubmit(post.id)}
                        disabled={submitting[post.id]}
                        className="rounded-full bg-linear-to-r from-blue-600 via-sky-500 to-indigo-500 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submitting[post.id] ? 'Posting...' : 'Post Comment'}
                      </button>
                      <button
                        onClick={() => setShowCommentBox(prev => ({ ...prev, [post.id]: false }))}
                        className="rounded-full bg-white/70 px-6 py-2 text-sm font-semibold text-blue-600 transition hover:bg-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {interactions[post.id]?.comments && interactions[post.id].comments.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {interactions[post.id].comments.slice(0, 2).map((comment) => (
                      <div key={comment.id} className="rounded-2xl bg-white/80 p-3 shadow-sm shadow-blue-100">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-semibold text-blue-700">{comment.name}</p>
                            <p className="mt-1 text-sm text-gray-600">{comment.comment_text}</p>
                          </div>
                          <span className="text-xs text-blue-400">{formatDate(comment.created_at)}</span>
                        </div>
                      </div>
                    ))}
                    {interactions[post.id].comments.length > 2 && (
                      <Link
                        href={`/blog/${post.id}`}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-indigo-500"
                      >
                        View all {interactions[post.id].comments.length} comments
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="flex justify-center">
        <Link
          href="/blog"
          className="inline-flex items-center gap-3 rounded-full border border-blue-200 bg-white/80 px-8 py-3 text-sm font-semibold text-blue-600 shadow-lg shadow-blue-100 transition hover:bg-linear-to-r hover:from-blue-600 hover:to-indigo-500 hover:text-white"
        >
          Discover more stories
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
