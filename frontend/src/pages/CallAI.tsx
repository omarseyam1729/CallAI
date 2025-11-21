import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { chatApi } from '@/lib/api'
import type { ChatMessage } from '@/lib/types'
import { Send, Code, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface MessageWithQuery extends ChatMessage {
  query_used?: string | null
}

export default function CallAI() {
  const [messages, setMessages] = useState<MessageWithQuery[]>([])
  const [input, setInput] = useState('')
  const [showQuery, setShowQuery] = useState<Record<number, boolean>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const mutation = useMutation({
    mutationFn: (message: string) => {
      return chatApi.sendMessage(message, messages)
    },
    onSuccess: (response) => {
      // Add user message
      const userMessage: MessageWithQuery = {
        role: 'user',
        content: input,
        timestamp: new Date().toISOString(),
      }
      
      // Add assistant response with SQL query
      const assistantMessage: MessageWithQuery = {
        role: 'assistant',
        content: response.answer,
        timestamp: response.timestamp,
        query_used: response.query_used,
      }
      
      setMessages((prev) => [...prev, userMessage, assistantMessage])
      setInput('')
    },
    onError: (error: Error) => {
      const userMessage: MessageWithQuery = {
        role: 'user',
        content: input,
        timestamp: new Date().toISOString(),
      }
      
      const errorMessage: MessageWithQuery = {
        role: 'assistant',
        content: `Error: ${error.message}. Please try again.`,
        timestamp: new Date().toISOString(),
      }
      
      setMessages((prev) => [...prev, userMessage, errorMessage])
      setInput('')
    },
  })

  const handleSend = () => {
    if (!input.trim() || mutation.isPending) return
    
    mutation.mutate(input)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const toggleQuery = (index: number) => {
    setShowQuery((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">callAI</h1>
        <p className="text-muted-foreground">
          Ask natural language questions about your call data
        </p>
      </div>

      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle>Chat</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                <p className="text-lg mb-2">Start a conversation</p>
                <p className="text-sm">
                  Try asking: "How many calls do we have?" or "Show me calls with positive sentiment"
                </p>
              </div>
            )}

            {messages.map((message, index) => {
              const isUser = message.role === 'user'
              const hasQuery = !isUser && message.query_used

              return (
                <div
                  key={index}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      isUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                    {message.timestamp && (
                      <div
                        className={`text-xs mt-2 ${
                          isUser
                            ? 'text-primary-foreground/70'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {formatDate(message.timestamp)}
                      </div>
                    )}
                    
                    {hasQuery && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => toggleQuery(index)}
                        >
                          <Code className="h-3 w-3 mr-1" />
                          {showQuery[index] ? 'Hide' : 'Show'} SQL Query
                          {showQuery[index] ? (
                            <ChevronUp className="h-3 w-3 ml-1" />
                          ) : (
                            <ChevronDown className="h-3 w-3 ml-1" />
                          )}
                        </Button>
                        {showQuery[index] && (
                          <pre className="mt-2 p-2 bg-background rounded text-xs overflow-x-auto">
                            {message.query_used}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {mutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question about your call data..."
                disabled={mutation.isPending}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || mutation.isPending}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

