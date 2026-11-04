// src/components/SearchableAddressSelect.tsx
// Mộc Ngôn Hương — Premium Searchable Select for Vietnam 2026 Administrative Units
// Brand Colors: #3E5641 (Forest Green), #FAF8F3 (Ivory), #C89F5D (Gold)

import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';
import { normalizeVietnameseSearch } from '../data/address';

export interface AddressSelectOption {
  code: string;
  name: string;
  fullName?: string;
  badge?: string;
  extraInfo?: string;
}

interface SearchableAddressSelectProps {
  id: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  value: string; // selected code
  options: AddressSelectOption[];
  onChange: (code: string) => void;
  disabled?: boolean;
  emptyMessage?: string;
  helperText?: string;
  error?: string;
}

export const SearchableAddressSelect: React.FC<SearchableAddressSelectProps> = ({
  id,
  label,
  required = false,
  placeholder = 'Chọn một mục...',
  searchPlaceholder = 'Nhập tìm kiếm...',
  value,
  options,
  onChange,
  disabled = false,
  emptyMessage = 'Không tìm thấy kết quả phù hợp',
  helperText,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();

  // Find currently selected option
  const selectedOption = options.find((opt) => opt.code === value);

  // Filter options based on query
  const filteredOptions = React.useMemo(() => {
    const norm = normalizeVietnameseSearch(searchQuery);
    if (!norm) return options;

    return options.filter((opt) => {
      const nameNorm = normalizeVietnameseSearch(opt.name);
      const fullNorm = opt.fullName ? normalizeVietnameseSearch(opt.fullName) : '';
      const codeNorm = opt.code.toLowerCase();
      return nameNorm.includes(norm) || fullNorm.includes(norm) || codeNorm.includes(norm);
    });
  }, [options, searchQuery]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setFocusedIndex(-1);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev < filteredOptions.length - 1 ? prev + 1 : 0;
          scrollIntoView(next);
          return next;
        });
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : filteredOptions.length - 1;
          scrollIntoView(next);
          return next;
        });
        break;
      }
      case 'Enter': {
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[focusedIndex].code);
        } else if (filteredOptions.length === 1) {
          handleSelect(filteredOptions[0].code);
        }
        break;
      }
      case 'Escape': {
        e.preventDefault();
        setIsOpen(false);
        break;
      }
      case 'Tab': {
        setIsOpen(false);
        break;
      }
    }
  };

  const scrollIntoView = (index: number) => {
    if (!listRef.current) return;
    const item = listRef.current.children[index] as HTMLElement;
    if (item) {
      item.scrollIntoView({ block: 'nearest' });
    }
  };

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
  };

  return (
    <div className="relative w-full" ref={containerRef} onKeyDown={handleKeyDown}>
      <label
        htmlFor={id}
        className="block text-[12.5px] font-medium text-[#444444] mb-1 select-none"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Main trigger button */}
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full h-[46px] px-3.5 rounded-xl border text-left flex items-center justify-between text-[13.5px] transition-all duration-200 outline-none ${
          disabled
            ? 'bg-[#f5f3ee] border-[#e0dad0] text-[#a0998d] cursor-not-allowed'
            : isOpen
            ? 'bg-white border-[#3e5641] ring-2 ring-[#3e5641]/15 shadow-sm text-[#222222]'
            : error
            ? 'bg-white border-red-400 ring-1 ring-red-400/20 text-[#222222]'
            : 'bg-white border-[#d8d2c7] hover:border-[#b8b0a2] text-[#222222]'
        }`}
      >
        <span className="truncate pr-2">
          {selectedOption ? (
            <span className="font-medium text-[#222222]">
              {selectedOption.fullName || selectedOption.name}
            </span>
          ) : (
            <span className="text-[#8c827a]">{placeholder}</span>
          )}
        </span>

        <span className="flex items-center gap-1 shrink-0 text-[#7a7268]">
          {selectedOption && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              onClick={handleClear}
              className="p-1 rounded-full hover:bg-stone-100 text-[#8c827a] hover:text-[#3e5641] transition-colors"
              title="Xóa lựa chọn"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#3e5641]' : 'text-[#8c827a]'
            }`}
          />
        </span>
      </button>

      {/* Helper text or Error */}
      {error ? (
        <p className="text-red-500 text-[11.5px] mt-1 pl-1">{error}</p>
      ) : helperText ? (
        <p className="text-[#777777] text-[11.5px] mt-1 pl-1">{helperText}</p>
      ) : null}

      {/* Floating Dropdown Panel */}
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-[#d8d2c7] rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          style={{ maxHeight: '320px' }}
        >
          {/* Search Bar inside Dropdown */}
          <div className="p-2.5 border-b border-[#ede9e2] bg-[#faf8f3]">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-[#8c827a] absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setFocusedIndex(-1);
                }}
                placeholder={searchPlaceholder}
                className="w-full h-[36px] pl-9 pr-8 text-[13px] bg-white border border-[#d8d2c7] rounded-lg focus:outline-none focus:border-[#3e5641] focus:ring-1 focus:ring-[#3e5641] placeholder:text-[#a0998d]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2.5 text-[#8c827a] hover:text-[#3e5641] p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Options list */}
          <ul
            ref={listRef}
            className="overflow-y-auto divide-y divide-[#f5f2eb] max-h-[240px] focus:outline-none"
            style={{ overscrollBehavior: 'contain' }}
          >
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-6 text-center text-[13px] text-[#8c827a]">
                {emptyMessage}
              </li>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = opt.code === value;
                const isFocused = index === focusedIndex;

                return (
                  <li
                    key={opt.code}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.code)}
                    onMouseEnter={() => setFocusedIndex(index)}
                    className={`px-3.5 py-2.5 text-[13.5px] cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-[#3e5641]/10 text-[#3e5641] font-medium'
                        : isFocused
                        ? 'bg-[#faf8f3] text-[#222222]'
                        : 'text-[#333333] hover:bg-[#faf8f3]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="truncate">
                        {opt.fullName || opt.name}
                      </span>
                      {opt.badge && (
                        <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-[#e8e4dc] text-[#555047] shrink-0 font-normal">
                          {opt.badge}
                        </span>
                      )}
                      {opt.extraInfo && (
                        <span className="text-[11px] text-[#8c827a] shrink-0 hidden sm:inline">
                          ({opt.extraInfo})
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-[#3e5641] shrink-0 ml-2" />
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

