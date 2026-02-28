import { useState } from 'react';
import { scentProfiles } from '../../data/products';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ScentFilterProps {
  selectedProfiles: string[];
  selectedNotes: string[];
  onProfileToggle: (profile: string) => void;
  onNoteToggle: (note: string) => void;
  onClear: () => void;
}

export function ScentFilter({
  selectedProfiles,
  selectedNotes,
  onProfileToggle,
  onNoteToggle,
  onClear
}: ScentFilterProps) {
  const [expandedProfiles, setExpandedProfiles] = useState<string[]>([]);

  const toggleExpanded = (profileKey: string) => {
    setExpandedProfiles(prev =>
      prev.includes(profileKey)
        ? prev.filter(p => p !== profileKey)
        : [...prev, profileKey]
    );
  };

  const hasActiveFilters = selectedProfiles.length > 0 || selectedNotes.length > 0;

  return (
    <div className="bg-white border-b sticky top-16 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Filter by Scent Profile</h3>
          {hasActiveFilters && (
            <button
              onClick={onClear}
              className="text-sm text-amber-600 hover:text-amber-700 font-medium"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="space-y-2">
          {Object.entries(scentProfiles).map(([key, profile]) => {
            const isExpanded = expandedProfiles.includes(key);
            const isSelected = selectedProfiles.includes(key);

            return (
              <div key={key} className="border rounded-lg overflow-hidden">
                {/* Main Profile Button */}
                <button
                  onClick={() => toggleExpanded(key)}
                  className={`w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-amber-50 border-l-4 border-l-amber-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{profile.icon}</span>
                    <span className="font-medium">{profile.name}</span>
                    {isSelected && (
                      <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {/* Nested Notes */}
                {isExpanded && (
                  <div className="bg-gray-50 p-3 border-t">
                    <div className="flex flex-wrap gap-2">
                      {/* Select All Profile Button */}
                      <button
                        onClick={() => onProfileToggle(key)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          isSelected
                            ? 'bg-amber-500 text-white'
                            : 'bg-white border hover:border-amber-500'
                        }`}
                      >
                        All {profile.name}
                      </button>

                      {/* Individual Notes */}
                      {profile.notes.map((note) => {
                        const noteSelected = selectedNotes.includes(note);
                        return (
                          <button
                            key={note}
                            onClick={() => onNoteToggle(note)}
                            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                              noteSelected
                                ? 'bg-black text-white'
                                : 'bg-white border hover:border-black'
                            }`}
                          >
                            {note}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600 mb-2">Active filters:</p>
            <div className="flex flex-wrap gap-2">
              {selectedProfiles.map(profile => (
                <span
                  key={profile}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium"
                >
                  {scentProfiles[profile as keyof typeof scentProfiles].name}
                </span>
              ))}
              {selectedNotes.map(note => (
                <span
                  key={note}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs"
                >
                  {note}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
