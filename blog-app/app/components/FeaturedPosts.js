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

      // Group interactions by blog_id
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
      const { data, error } = await supabase
        .from('interactions')
        .insert([
          {
            blog_id: blogId,
            is_liked: true
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Update local state
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

      // Update local state
      setInteractions(prev => ({
        ...prev,
        [blogId]: {
          likes: prev[blogId]?.likes || 0,
          comments: [...(prev[blogId]?.comments || []), data]
        }
      }));

      // Reset form
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
      <div className="flex justify-center items-center py-20">
        <svg className="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl shadow-md border border-gray-200">
        <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Posts Yet</h3>
        <p className="text-gray-600 mb-6">Be the first to share your story!</p>
        <Link
          href="/src/register"
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
        >
          Start Writing
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {posts.map((post) => (
        <article
          key={post.id}
          className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow border border-gray-100"
        >
          {post.image_base64 ? (
            <div className="h-48 relative overflow-hidden">
              <img 
                src={post.image_base64} 
                alt={post.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black opacity-10"></div>
              <div className="absolute top-4 right-4">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {getFirstTag(post.reference)}
                </span>
              </div>
            </div>
          ) : (
            <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 relative">
              <div className="absolute inset-0 bg-black opacity-20"></div>
              <div className="absolute top-4 right-4">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {getFirstTag(post.reference)}
                </span>
              </div>
            </div>
          )}
          <div className="p-6">
            {post.sub_title && (
              <p className="text-sm font-medium text-blue-600 mb-1">{post.sub_title}</p>
            )}
            <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors line-clamp-2">
              <Link href={`/blog/${post.id}`}>{post.title}</Link>
            </h3>
            <p className="text-gray-600 mb-4 line-clamp-3">
              {truncateText(post.description, 120)}
            </p>
            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span className="font-medium">{post.users?.full_name || 'Anonymous'}</span>
              <span>{formatDate(post.created_at)}</span>
            </div>

            {/* Interactions Section */}
            <div className="border-t border-gray-100 pt-4">
              {/* Like and Comment Buttons */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => handleLike(post.id)}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">
                    {interactions[post.id]?.likes || 0} Likes
                  </span>
                </button>
                <button
                  onClick={() => setShowCommentBox(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="text-sm font-medium">
                    {interactions[post.id]?.comments?.length || 0} Comments
                  </span>
                </button>
              </div>

              {/* Comment Box */}
              {showCommentBox[post.id] && (
                <div className="bg-gray-50 rounded-lg p-4 mb-3">
                  <input
                    type="text"
                    placeholder="Your name"
                    value={commentData[post.id]?.name || ''}
                    onChange={(e) => setCommentData(prev => ({
                      ...prev,
                      [post.id]: { ...prev[post.id], name: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    placeholder="Write a comment..."
                    value={commentData[post.id]?.comment || ''}
                    onChange={(e) => setCommentData(prev => ({
                      ...prev,
                      [post.id]: { ...prev[post.id], comment: e.target.value }
                    }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCommentSubmit(post.id)}
                      disabled={submitting[post.id]}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {submitting[post.id] ? 'Posting...' : 'Post Comment'}
                    </button>
                    <button
                      onClick={() => setShowCommentBox(prev => ({ ...prev, [post.id]: false }))}
                      className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Display Comments */}
              {interactions[post.id]?.comments && interactions[post.id].comments.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {interactions[post.id].comments.slice(0, 2).map((comment) => (
                    <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-900">{comment.name}</span>
                        <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-600">{comment.comment_text}</p>
                    </div>
                  ))}
                  {interactions[post.id].comments.length > 2 && (
                    <Link
                      href={`/blog/${post.id}`}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View all {interactions[post.id].comments.length} comments
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
