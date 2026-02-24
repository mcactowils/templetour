'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isAdminUser } from '../../lib/admin'

interface User {
  id: string
  name: string
  email: string
}

interface Message {
  id: string
  createdAt: string
  content: string
  userId: string
  threadId?: string
  replyToId?: string
  user: User
  replies?: Message[]
}

interface ScheduleThread {
  id: string
  title: string
  scheduledDate: string
  temple: {
    id: string
    name: string
    city: string
    state?: string
  }
  createdBy: {
    id: string
    name: string
  }
  comments: Array<{
    id: string
    createdAt: string
    content: string
    user: User
  }>
  _count: {
    comments: number
  }
}

export default function MessagesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [standaloneMessages, setStandaloneMessages] = useState<Message[]>([])
  const [scheduleThreads, setScheduleThreads] = useState<ScheduleThread[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [replyTo, setReplyTo] = useState<{ messageId: string; userName: string } | null>(null)
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin?callbackUrl=/messages')
      return
    }
    fetchMessages()
  }, [session, status, router])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/messages')
      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }
      const data = await response.json()
      setStandaloneMessages(data.standaloneMessages || [])
      setScheduleThreads(data.scheduleThreads || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const submitMessage = async () => {
    if (!newMessage.trim() || submitting) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage.trim(),
          replyToId: replyTo?.messageId
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send message')
      }

      setNewMessage('')
      setReplyTo(null)
      await fetchMessages()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setSubmitting(false)
    }
  }

  const submitReply = async (scheduleId: string) => {
    const replyText = replyTexts[scheduleId]
    if (!replyText?.trim() || submitting) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/schedules/${scheduleId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyText.trim(),
          userId: (session?.user as any)?.id
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send reply')
      }

      setReplyTexts(prev => ({ ...prev, [scheduleId]: '' }))
      await fetchMessages()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reply')
    } finally {
      setSubmitting(false)
    }
  }

  const submitMessageReply = async (messageId: string) => {
    const replyText = replyTexts[messageId]
    if (!replyText?.trim() || submitting) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyText.trim(),
          replyToId: messageId
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send reply')
      }

      setReplyTexts(prev => ({ ...prev, [messageId]: '' }))
      await fetchMessages()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reply')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return

    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete message')
      }

      await fetchMessages()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message')
    }
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diffInHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      })
    } else if (diffInHours < 24 * 7) {
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit'
      })
    } else {
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    }
  }

  const toggleThread = (threadId: string) => {
    setExpandedThreads(prev => {
      const newSet = new Set(prev)
      if (newSet.has(threadId)) {
        newSet.delete(threadId)
      } else {
        newSet.add(threadId)
      }
      return newSet
    })
  }

  const canDelete = (userId: string) => {
    return userId === (session?.user as any)?.id || isAdminUser(session?.user)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-warm-coral mx-auto"></div>
          <p className="mt-4 text-medium-gray">Loading messages...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-charcoal mb-2">Messages</h1>
        <p className="text-medium-gray">
          Conversations from appointments and standalone messages
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 font-bold text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* New Message */}
      <div className="bg-white rounded-xl shadow-sm border border-light-gray p-6 mb-8">
        <h2 className="text-xl font-semibold text-charcoal mb-4">
          {replyTo ? `Reply to ${replyTo.userName}` : 'New Message'}
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={replyTo ? "Write your reply..." : "Start a new conversation..."}
            className="flex-1 px-4 py-3 border border-light-gray rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-warm-coral focus:border-warm-coral"
            rows={3}
          />
          <div className="flex flex-col gap-2">
            <button
              onClick={submitMessage}
              disabled={!newMessage.trim() || submitting}
              className="px-6 py-3 bg-white text-[#B77D63] border border-[#B77D63] hover:bg-[#B77D63] hover:text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {submitting ? 'Sending...' : replyTo ? 'Reply' : 'Send'}
            </button>
            {replyTo && (
              <button
                onClick={() => setReplyTo(null)}
                className="px-6 py-2 text-medium-gray hover:text-charcoal transition-colors text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Standalone Messages */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-charcoal">General Messages</h2>

          {standaloneMessages.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-light-gray p-8 text-center">
              <p className="text-medium-gray">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {standaloneMessages.map((message) => (
                <div key={message.id} className="bg-white rounded-xl shadow-sm border border-light-gray p-6">
                  {/* Message Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-warm-coral rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3">
                        {message.user.name?.charAt(0).toUpperCase() || message.user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-medium text-charcoal text-sm">
                          {message.user.name || 'User'}
                        </span>
                        <span className="text-xs text-medium-gray ml-2">
                          {formatDate(message.createdAt)}
                        </span>
                      </div>
                    </div>
                    {canDelete(message.userId) && (
                      <button
                        onClick={() => deleteMessage(message.id)}
                        className="text-red-400 hover:text-red-600 text-sm p-2 hover:bg-red-50 rounded transition-colors"
                        title="Delete message"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* Message Content */}
                  <p className="text-charcoal text-sm whitespace-pre-wrap mb-4 ml-11">
                    {message.content}
                  </p>

                  {/* Replies */}
                  {message.replies && message.replies.length > 0 && (
                    <div className="ml-11 space-y-3 border-l-2 border-light-gray pl-4">
                      {message.replies.map((reply) => (
                        <div key={reply.id} className="bg-warm-gray-light rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <span className="font-medium text-charcoal text-xs">
                                {reply.user.name || 'User'}
                              </span>
                              <span className="text-xs text-medium-gray ml-2">
                                {formatDate(reply.createdAt)}
                              </span>
                            </div>
                            {canDelete(reply.userId) && (
                              <button
                                onClick={() => deleteMessage(reply.id)}
                                className="text-red-400 hover:text-red-600 text-xs p-1 hover:bg-red-50 rounded transition-colors"
                                title="Delete reply"
                              >
                                ×
                              </button>
                            )}
                          </div>
                          <p className="text-charcoal text-xs whitespace-pre-wrap">
                            {reply.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Form */}
                  <div className="ml-11 mt-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={replyTexts[message.id] || ''}
                        onChange={(e) => setReplyTexts(prev => ({ ...prev, [message.id]: e.target.value }))}
                        placeholder="Write a reply..."
                        className="flex-1 px-3 py-2 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-warm-coral focus:border-warm-coral"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            submitMessageReply(message.id)
                          }
                        }}
                      />
                      <button
                        onClick={() => submitMessageReply(message.id)}
                        disabled={!replyTexts[message.id]?.trim() || submitting}
                        className="px-4 py-2 bg-white text-[#B77D63] border border-[#B77D63] hover:bg-[#B77D63] hover:text-white rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Appointment Threads */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-charcoal">Appointment Discussions</h2>

          {scheduleThreads.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-light-gray p-8 text-center">
              <p className="text-medium-gray">No appointment discussions yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {scheduleThreads.map((thread) => (
                <div key={thread.id} className="bg-white rounded-xl shadow-sm border border-light-gray">
                  {/* Thread Header */}
                  <div
                    className="p-4 border-b border-light-gray cursor-pointer hover:bg-warm-gray-light transition-colors"
                    onClick={() => toggleThread(thread.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-charcoal text-sm mb-1">
                          {thread.title}
                        </h3>
                        <p className="text-xs text-medium-gray">
                          {thread.temple.name} • {new Date(thread.scheduledDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-medium-gray">
                          {thread._count.comments} comment{thread._count.comments !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/schedules/${thread.id}?from=messages`}
                          className="text-warm-coral hover:text-warm-coral-hover text-xs font-medium px-3 py-1 rounded hover:bg-warm-coral/5 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View
                        </Link>
                        <span className="text-medium-gray">
                          {expandedThreads.has(thread.id) ? '−' : '+'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Thread Comments */}
                  {expandedThreads.has(thread.id) && (
                    <div className="p-4">
                      <div className="space-y-3 mb-4">
                        {thread.comments.map((comment) => (
                          <div key={comment.id} className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-warm-coral rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 mt-0.5">
                              {comment.user.name?.charAt(0).toUpperCase() || comment.user.email.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <span className="font-medium text-charcoal text-xs">
                                    {comment.user.name || 'User'}
                                  </span>
                                  <span className="text-xs text-medium-gray ml-2">
                                    {formatDate(comment.createdAt)}
                                  </span>
                                </div>
                              </div>
                              <p className="text-charcoal text-xs mt-1 whitespace-pre-wrap">
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Reply Form */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={replyTexts[thread.id] || ''}
                          onChange={(e) => setReplyTexts(prev => ({ ...prev, [thread.id]: e.target.value }))}
                          placeholder="Join the discussion..."
                          className="flex-1 px-3 py-2 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-warm-coral focus:border-warm-coral"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              submitReply(thread.id)
                            }
                          }}
                        />
                        <button
                          onClick={() => submitReply(thread.id)}
                          disabled={!replyTexts[thread.id]?.trim() || submitting}
                          className="px-4 py-2 bg-white text-[#B77D63] border border-[#B77D63] hover:bg-[#B77D63] hover:text-white rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}