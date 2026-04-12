'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ChatInterface from '@/components/chat-interface';

const COLLEGES = [
  'IIT Delhi',
  'IIT Bombay',
  'Delhi University',
  'Ashoka University',
  'BITS Pilani',
  'Manipal University',
];

export default function ExploreCollegePage() {
  const { selectedCollege, setSelectedCollege, chatHistory, addChatMessage, selectedExam } =
    useAppStore();
  const [input, setInput] = useState('');
  const [filteredColleges, setFilteredColleges] = useState(COLLEGES);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleCollegeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSelectedCollege(value);
    setShowSuggestions(true);

    if (value) {
      const filtered = COLLEGES.filter((college) =>
        college.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredColleges(filtered);
    } else {
      setFilteredColleges(COLLEGES);
    }
  };

  const selectCollege = (college: string) => {
    setSelectedCollege(college);
    setShowSuggestions(false);
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Add user message
    addChatMessage('user', message);
    setInput('');
    setIsLoading(true);

    try {
      const resp = await fetch('http://localhost:8000/ask-college-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: message,
          college_name: selectedCollege,
        }),
      });

      if (!resp.ok) {
        throw new Error('Failed to fetch from backend');
      }

      const data = await resp.json();
      addChatMessage('bot', data.answer);
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      addChatMessage('bot', 'Sorry, I encountered an error. Please make sure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKnowCollege = async () => {
    if (!selectedCollege.trim()) return;

    // Add initial user interest message
    addChatMessage('user', `Tell me about ${selectedCollege}`);
    setIsLoading(true);

    try {
      const resp = await fetch('http://localhost:8000/college-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          college_name: selectedCollege,
        }),
      });

      if (!resp.ok) {
        throw new Error('Failed to fetch from backend');
      }

      const data = await resp.json();
      addChatMessage('bot', '__COLLEGE_CARD__' + data.answer);
    } catch (error) {
      console.error('Error in handleKnowCollege:', error);
      addChatMessage('bot', 'Sorry, I couldn\'t fetch the college details. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full p-4 lg:p-8 bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <h1 className="text-4xl font-bold text-foreground mb-2">Explore a College</h1>
        <p className="text-muted-foreground">Find information about colleges and universities</p>
      </div>

      {/* Main Content Area */}
      {chatHistory.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          {/* College Search Area */}
          <div className="w-full max-w-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <div className="relative">
              <label className="block text-sm font-medium text-foreground mb-2">
                Search College
              </label>
              <Input
                type="text"
                placeholder="Type college name..."
                value={selectedCollege}
                onChange={handleCollegeChange}
                className="bg-background border-2 border-primary/30 transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />

              {/* Suggestions Dropdown */}
              {/* {showSuggestions && filteredColleges.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card/95 backdrop-blur-sm border-2 border-primary/30 rounded-lg shadow-xl z-10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {filteredColleges.map((college) => (
                    <button
                      key={college}
                      onClick={() => selectCollege(college)}
                      className="w-full text-left px-4 py-3 hover:bg-primary hover:text-primary-foreground transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {college}
                    </button>
                  ))}
                </div>
              )} */}
            </div>

            {/* Know More Button */}
            <Button
              onClick={handleKnowCollege}
              disabled={!selectedCollege.trim() || isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg font-semibold transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Know About This College'}
            </Button>
          </div>

          {/* Info Box */}
          <div className="w-full max-w-2xl bg-accent/10 border border-accent rounded-2xl p-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="space-y-2">
              <p className="text-2xl">🎓</p>
              <p className="text-foreground/70">
                Select a college to learn about its programs, campus life, and opportunities
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in duration-500">
          <ChatInterface selectedExam={selectedExam} onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      )}
    </div>
  );
}
