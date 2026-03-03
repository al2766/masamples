import { useState } from 'react';
import { scentProfiles } from '../../data/products';
import { SlidersHorizontal, ChevronDown, ChevronUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  const [open, setOpen] = useState(false);
  const [expandedProfile, setExpandedProfile] = useState<string | null>(null);

  const hasActiveFilters = selectedProfiles.length > 0 || selectedNotes.length > 0;
  const activeCount = selectedProfiles.length + selectedNotes.length;

  const handleProfileClick = (key: string) => {
    setExpandedProfile(prev => prev === key ? null : key);
  };

  return (
    <div className="bg-white border-b">
      <div className="container mx-auto px-4">
        {/* Toggle bar */}
        <button
          onClick={() => setOpen(prev => !prev)}
          className="w-full flex items-center justify-between py-3 text-left"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-sm">Filter by Scent</span>
            {hasActiveFilters && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold">
                {activeCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button
                onClick={(e) => { e.stopPropagation(); onClear(); setExpandedProfile(null); }}
                className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
            {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
          </div>
        </button>

        {/* Expandable filter panel */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="filter-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <div className="pb-4">
                {/* Profiles — horizontal scrolling chips */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                  {Object.entries(scentProfiles).map(([key, profile]) => {
                    const isSelected = selectedProfiles.includes(key);
                    const isExpanded = expandedProfile === key;

                    return (
                      <button
                        key={key}
                        onClick={() => handleProfileClick(key)}
                        className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                          isSelected
                            ? 'bg-amber-500 border-amber-500 text-white'
                            : isExpanded
                            ? 'bg-amber-50 border-amber-300 text-amber-800'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-amber-400 hover:text-amber-700'
                        }`}
                      >
                        <span>{profile.icon}</span>
                        <span>{profile.name}</span>
                        {isExpanded && !isSelected && <ChevronUp className="h-3 w-3" />}
                        {!isExpanded && !isSelected && <ChevronDown className="h-3 w-3 opacity-40" />}
                      </button>
                    );
                  })}
                </div>

                {/* Notes panel for expanded profile */}
                <AnimatePresence initial={false}>
                  {expandedProfile && (
                    <motion.div
                      key={expandedProfile}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex flex-wrap gap-2">
                          {/* Select all for this profile */}
                          <button
                            onClick={() => onProfileToggle(expandedProfile)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                              selectedProfiles.includes(expandedProfile)
                                ? 'bg-amber-500 border-amber-500 text-white'
                                : 'bg-white border-gray-300 text-gray-600 hover:border-amber-400'
                            }`}
                          >
                            All {scentProfiles[expandedProfile as keyof typeof scentProfiles]?.name}
                          </button>

                          {scentProfiles[expandedProfile as keyof typeof scentProfiles]?.notes.map((note) => {
                            const noteSelected = selectedNotes.includes(note);
                            return (
                              <button
                                key={note}
                                onClick={() => onNoteToggle(note)}
                                className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                                  noteSelected
                                    ? 'bg-black border-black text-white'
                                    : 'bg-white border-gray-300 text-gray-600 hover:border-black'
                                }`}
                              >
                                {note}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Active filters summary */}
                {hasActiveFilters && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {selectedProfiles.map(profile => (
                      <span
                        key={profile}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-medium"
                      >
                        {scentProfiles[profile as keyof typeof scentProfiles].icon}{' '}
                        {scentProfiles[profile as keyof typeof scentProfiles].name}
                      </span>
                    ))}
                    {selectedNotes.map(note => (
                      <span
                        key={note}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs"
                      >
                        {note}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sticky active filters bar — visible when closed + filters active */}
      {hasActiveFilters && !open && (
        <div className="sticky top-16 z-10 bg-amber-50 border-t border-amber-100">
          <div className="container mx-auto px-4 py-1.5 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-amber-700 font-medium shrink-0">Filtered:</span>
            {selectedProfiles.map(profile => (
              <span
                key={profile}
                className="inline-flex items-center px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full text-xs font-medium"
              >
                {scentProfiles[profile as keyof typeof scentProfiles].name}
              </span>
            ))}
            {selectedNotes.map(note => (
              <span
                key={note}
                className="inline-flex items-center px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full text-xs"
              >
                {note}
              </span>
            ))}
            <button
              onClick={onClear}
              className="ml-auto text-xs text-amber-700 hover:text-amber-900 font-medium shrink-0"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
