import { useState, useEffect } from 'react';

const useAutocomplete = (passwordEntries, inputValue, isFocused) => {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (!isFocused) {
      setSuggestions([]); // No suggestions if the input is not focused
      return;
    }

    const getDepth = (path) => (path.match(/\//g) || []).length;

    const findSuggestions = (entries, currentDepth, targetDepth, pathParts) => {
      if (currentDepth === targetDepth) {
        // Extract the last part of the path to use as the filter term
        const filterTerm = pathParts[targetDepth] || '';

        // Show all or filter by the last path part
        return entries
          .filter(entry =>
            entry.children && entry.children.length > 0 &&
            (!filterTerm.trim() || entry.name.toLowerCase().includes(filterTerm.toLowerCase()))
          )
          .map(entry => entry.name);
      }

      // Find the matching entry in the current depth
      const currentPart = pathParts[currentDepth];
      const matchingEntry = entries.find(entry => entry.name.toLowerCase() === currentPart?.toLowerCase());

      if (matchingEntry && matchingEntry.children) {
        return findSuggestions(matchingEntry.children, currentDepth + 1, targetDepth, pathParts);
      }
      return [];
    };

    const depth = getDepth(inputValue);
    const pathParts = inputValue.split('/').filter(Boolean);

    const newSuggestions = findSuggestions(passwordEntries, 0, depth, pathParts);
    setSuggestions(newSuggestions);
  }, [passwordEntries, inputValue, isFocused]);

  return suggestions;
};

export default useAutocomplete;
