'use client';

import { useState } from 'react';
import { useAuth } from '../../utils/auth_context';
import { supabase } from '../../utils/supabase';
import { useRouter } from 'next/navigation';

export default function CreateBlog() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    sub_title: '',
    description: '',
    image_base64: '',
    reference: {
      sources: [],
      tags: []
    }
  });

  const [referenceInput, setReferenceInput] = useState({
    source: '',
    tag: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setFormData({
          ...formData,
          image_base64: base64String
        });
        setImagePreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const addSource = () => {
    if (referenceInput.source.trim()) {
      setFormData({
        ...formData,
        reference: {
          ...formData.reference,
          sources: [...formData.reference.sources, referenceInput.source.trim()]
        }
      });
      setReferenceInput({ ...referenceInput, source: '' });
    }
  };

  const removeSource = (index) => {
    const newSources = formData.reference.sources.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      reference: {
        ...formData.reference,
        sources: newSources
      }
    });
  };

  const addTag = () => {
    if (referenceInput.tag.trim()) {
      setFormData({
        ...formData,
        reference: {
          ...formData.reference,
          tags: [...formData.reference.tags, referenceInput.tag.trim()]
        }
      });
      setReferenceInput({ ...referenceInput, tag: '' });
    }
  };

  const removeTag = (index) => {
    const newTags = formData.reference.tags.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      reference: {
        ...formData.reference,
        tags: newTags
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    if (formData.description.length < 100) {
      setError('Description should be at least 100 characters');
      return;
    }

    setLoading(true);

    try {
      const { data, error: insertError } = await supabase
        .from('blog_posts')
        .insert([
          {
            user_id: user.id,
            title: formData.title.trim(),
            sub_title: formData.sub_title.trim() || null,
            description: formData.description.trim(),
            image_base64: formData.image_base64 || null,
            reference: formData.reference.sources.length > 0 || formData.reference.tags.length > 0 
              ? formData.reference 
              : null
          }
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      setSuccess('Blog post created successfully!');
      
      setFormData({
        title: '',
        sub_title: '',
        description: '',
        image_base64: '',
        reference: {
          sources: [],
          tags: []
        }
      });
      setImagePreview(null);

      setTimeout(() => {
        router.push('/my-posts');
      }, 2000);

    } catch (err) {
      console.error('Error creating blog post:', err);
      setError(err.message || 'Failed to create blog post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Blog Post</h1>
        <p className="text-gray-600">Share your thoughts and ideas with the community</p>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {success}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Blog Details</h2>

          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100"
              placeholder="Enter your blog title"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="sub_title" className="block text-sm font-semibold text-gray-700 mb-2">
              Subtitle
            </label>
            <input
              type="text"
              id="sub_title"
              name="sub_title"
              value={formData.sub_title}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100"
              placeholder="Enter a subtitle (optional)"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={loading}
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 resize-none"
              placeholder="Write your blog content here... (minimum 100 characters)"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.description.length} / 100 characters minimum
            </p>
          </div>

          <div className="mb-6">
            <label htmlFor="image" className="block text-sm font-semibold text-gray-700 mb-2">
              Featured Image
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex-1">
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={loading}
                  className="hidden"
                />
                <div className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors cursor-pointer text-center disabled:bg-gray-100">
                  <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm text-gray-600">
                    {imagePreview ? 'Change Image' : 'Click to upload image'}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">Max size: 5MB</p>
                </div>
              </label>
            </div>

            {imagePreview && (
              <div className="mt-4 relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-h-64 object-cover rounded-lg border border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setFormData({ ...formData, image_base64: '' });
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">References & Tags</h2>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Sources
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={referenceInput.source}
                onChange={(e) => setReferenceInput({ ...referenceInput, source: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSource())}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="Add a source URL or reference"
              />
              <button
                type="button"
                onClick={addSource}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Add
              </button>
            </div>
            {formData.reference.sources.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.reference.sources.map((source, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {source}
                    <button
                      type="button"
                      onClick={() => removeSource(index)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={referenceInput.tag}
                onChange={(e) => setReferenceInput({ ...referenceInput, tag: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="Add a tag (e.g., technology, lifestyle)"
              />
              <button
                type="button"
                onClick={addTag}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Add
              </button>
            </div>
            {formData.reference.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.reference.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Publishing...
              </span>
            ) : (
              'Publish Blog Post'
            )}
          </button>
          <button
            type="button"
            onClick={() => router.push('/src/dashboard')}
            disabled={loading}
            className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
