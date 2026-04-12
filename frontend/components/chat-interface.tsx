'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mic, Send } from 'lucide-react';
import CollegeCard from '@/components/college-card';

interface ChatInterfaceProps {
  selectedExam: string;
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
}

function parseCollegeContent(content: string): { data: CollegeData | null; sources: string | null } {
  // Extract sources section (everything after **Sources:**)
  const sourcesMatch = content.match(/\*\*Sources:\*\*\s*([\s\S]*?)$/i);
  const sources = sourcesMatch ? sourcesMatch[1].trim() : null;

  // Try JSON inside ```json ... ``` fences first, then raw JSON
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const jsonStr = fenced
    ? fenced[1].trim()
    : content.split('**Sources:**')[0].trim();

  try {
    const parsed = JSON.parse(jsonStr);
    // Accept any JSON object — prefix already guarantees this is a college card
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return { data: parsed as CollegeData, sources };
    }
  } catch {
    // not valid JSON — fall through to plain text rendering
  }
  return { data: null, sources: null };
}


function renderBold(text: string) {
  return text.split(/(\*\*.*?\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part
  );
}

export default function ChatInterface({
  selectedExam,
  onSendMessage,
  isLoading: externalIsLoading,
}: ChatInterfaceProps) {
  const { chatHistory } = useAppStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [displayedMessages, setDisplayedMessages] = useState(chatHistory);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, displayedMessages]);

  useEffect(() => {
    setDisplayedMessages(chatHistory);
  }, [chatHistory]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    setInput('');
    setIsLoading(true);

    await onSendMessage(message);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] w-full max-w-4xl mx-auto">
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent mb-4 space-y-4 px-4 py-4">
        {displayedMessages.map((message, index) => {
          const isCollegeCard = message.role === 'bot' && message.content.startsWith('__COLLEGE_CARD__');
          const rawContent = isCollegeCard ? message.content.slice('__COLLEGE_CARD__'.length) : message.content;
          const { data: collegeData, sources } = isCollegeCard
            ? parseCollegeContent(rawContent)
            : { data: null, sources: null };

          return (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              {collegeData ? (
                <div className="w-full max-w-3xl space-y-3">
                  <CollegeCard data={collegeData} />
                  {sources && (
                    <div className="bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm">
                      <p className="font-semibold text-foreground/70 mb-1">📚 Sources</p>
                      <div className="space-y-1">
                        {sources.split('\n').filter(Boolean).map((line, i) => {
                          const match = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
                          return match ? (
                            <a
                              key={i}
                              href={match[2]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-primary hover:underline truncate"
                            >
                              🔗 {match[1]}
                            </a>
                          ) : <p key={i} className="text-foreground/60">{line}</p>;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className={`max-w-2xl px-4 py-3 rounded-xl ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-none shadow-sm'
                      : 'bg-card border border-border text-foreground rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="text-base leading-relaxed whitespace-pre-wrap">
                    {renderBold(message.content)}
                  </p>
                </div>
              )}
            </div>
          );
        })}
        {isLoading || externalIsLoading ? (
          <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-card border border-border text-foreground rounded-xl rounded-bl-none px-4 py-3 shadow-sm">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                ></div>
                <div
                  className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                ></div>
              </div>
            </div>
          </div>
        ) : null}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-4 bg-background">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isLoading && !externalIsLoading) {
                  handleSendMessage(input);
                }
              }}
              disabled={isLoading || externalIsLoading}
              className="bg-card border-input transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Button
            onClick={() => handleSendMessage(input)}
            disabled={isLoading || externalIsLoading || !input.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 disabled:opacity-50"
          >
            <Send size={20} />
          </Button>
          <button
            disabled={isLoading || externalIsLoading}
            className="p-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors duration-200 disabled:opacity-50"
          >
            <Mic size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
