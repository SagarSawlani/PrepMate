'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';
import ChatInterface from '@/components/chat-interface';
import API_BASE_URL from '@/lib/api';

const EXAMS = ['JEE', 'NEET', 'GRE', 'CAT'];

export default function KnowYourExamPage() {
  const { selectedExam, setSelectedExam, chatHistory, addChatMessage } = useAppStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleExamChange = (value: string) => {
    setSelectedExam(value);
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Add user message
    addChatMessage('user', message);
    setInput('');
    setIsLoading(true);

    try {
      const resp = await fetch(`${API_BASE_URL}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: message,
          exam: selectedExam,
        }),
      });

      if (!resp.ok) {
        throw new Error('Failed to fetch from backend');
      }

      const data = await resp.json();
      addChatMessage('bot', data.answer);
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      addChatMessage('bot', 'Sorry, I encountered an error connecting to the service. Please make sure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full p-4 lg:p-8 bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <h1 className="text-4xl font-bold text-foreground mb-2">Know Your Exam</h1>
        <p className="text-muted-foreground">Select an exam and learn everything about it</p>
      </div>

      {/* Main Content Area */}
      {chatHistory.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          {/* Exam Dropdown */}
          <div className="w-full max-w-md animate-in fade-in slide-in-from-left-4 duration-500 delay-100">
            <label className="block text-sm font-medium text-foreground mb-2">Select Exam</label>
            <select
              value={selectedExam}
              onChange={(e) => handleExamChange(e.target.value)}
              className="w-full px-4 py-3 border-2 border-primary/30 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 hover:border-primary/50"
            >
              {EXAMS.map((exam) => (
                <option key={exam} value={exam}>
                  {exam}
                </option>
              ))}
            </select>
          </div>

          {/* Chat Placeholder */}
          <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
            <div className="bg-card border-2 border-primary/30 rounded-2xl p-8 text-center min-h-64 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="space-y-4">
                <div className="text-4xl">💡</div>
                <p className="text-muted-foreground text-lg">
                  Ask me anything about {selectedExam}. I&apos;m here to help you prepare!
                </p>
                <p className="text-sm text-muted-foreground/60">Start a conversation to learn more</p>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  placeholder={`Ask about ${selectedExam}...`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isLoading) {
                      handleSendMessage(input);
                    }
                  }}
                  className="bg-background border-2 border-primary/30 transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <Button
                onClick={() => handleSendMessage(input)}
                disabled={isLoading || !input.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200"
              >
                Send
              </Button>
              <button className="p-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors duration-200">
                <Mic size={20} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in duration-500">
          <ChatInterface
            selectedExam={selectedExam}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
}
