import { useRef, useState } from 'react';
import { Form, NavLink, redirect, useLoaderData, useNavigate, useNavigation } from 'react-router-dom';
import { FaSave, FaSpinner } from 'react-icons/fa';
import useAutocomplete from '../hooks/useAutocomplete';

export const loader = async () => {
  const passwordEntries = await window.api.getPasswordStoreEntries();

  return { passwordEntries };
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const updates = Object.fromEntries(formData);

  await window.api.savePasswordStoreEntry(updates.path, updates.content);

  return redirect(`/pass/${encodeURIComponent(updates.path)}`);
};

const NewPass = () => {
  const navigation = useNavigation();
  const navigate = useNavigate();
  const pathInputRef = useRef(null);
  const suggestionListRef = useRef(null);
  const { passwordEntries } = useLoaderData();
  const [enteredPath, setEnteredPath] = useState('');
  const [enteredContent, setEnteredContent] = useState('');
  const [isExistingPath, setIsExistingPath] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const isSubmitting = navigation.state === 'submitting';
  const suggestions = useAutocomplete(passwordEntries, enteredPath, isFocused);

  const findPasswordEntryByPath = (entries, path) => {
    for (const entry of entries) {
      if (entry.path === path) {
        return entry;
      }
      if (entry.children) {
        const found = findPasswordEntryByPath(entry.children, path);
        if (found) {
          return found;
        }
      }
    }

    return null;
  };

  const checkIfEntryExists = (enteredPath) => {
    let isPasswordEntryFound = false;
    if (enteredPath) {
      isPasswordEntryFound = !!findPasswordEntryByPath(passwordEntries, enteredPath);
    }
    setIsExistingPath(isPasswordEntryFound);
  };

  const handleOnPathChange = (e) => {
    const path = e.target.value;
    setEnteredPath(path);
    checkIfEntryExists(path);
  };

  const handleSuggestionClick = (suggestion) => {
    setEnteredPath((prevPath) => {
      const insertPositionForSuggestion = (prevPath.match(/\//g) || []).length;
      let newPath;

      if (prevPath.trim() === '') {
        newPath = `${suggestion}/`;
      } else {
        const pathParts = prevPath.split('/').filter(Boolean);
        pathParts[insertPositionForSuggestion] = suggestion;
        newPath = pathParts.join('/') + '/';
      }

      checkIfEntryExists(newPath);
      setTimeout(() => {
        if (pathInputRef.current) {
          pathInputRef.current.focus();
          pathInputRef.current.setSelectionRange(newPath.length, newPath.length);
        }
      }, 0);

      return newPath;
    });

    setIsFocused(true);
  };

  const handleOnContentChange = (e) => {
    const content = e.target.value;
    setEnteredContent(content);
  };

  const handleFocus = () => setIsFocused(true);

  const handleBlur = (e) => {
    if (
      e.relatedTarget !== null &&
      (pathInputRef.current.contains(e.relatedTarget) ||
        suggestionListRef.current.contains(e.relatedTarget))
    ) {

      return;
    }

    setIsFocused(false);
  };

  const isSaveDisabled = isExistingPath || enteredPath.trim() === '' || enteredContent.trim() === '';

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Form method="post">
        <div className="flex justify-between items-center border-b border-gray-200 mb-4 pb-2">
          <h3 className="text-xl font-medium text-gray-600 leading-none py-4">New password</h3>
        </div>

        <div className="mb-4 relative">
          {isExistingPath && (
            <p className="text-red-500 text-sm mb-1">This entry already exists. Please choose a different path.</p>
          )}
          <input
            className={`border rounded-md w-full p-2 mb-0 focus:outline-none focus:ring-2
              ${isExistingPath ? 'ring-red-500 border-red-500' : 'focus:ring-blue-500'}`}
            placeholder="Save path e.g. John/private/amazon.com"
            type="text"
            name="path"
            value={enteredPath}
            onChange={handleOnPathChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            ref={pathInputRef}
          />
          {isFocused && suggestions.length > 0 && (
            <div
              className="absolute top-full left-0 w-full border bg-gray-100 shadow-lg z-10 mt-1 rounded-b-md"
              onFocus={handleFocus}
              onBlur={handleBlur}
              ref={suggestionListRef}
              tabIndex="-1"
            >
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="px-4 py-2 cursor-pointer hover:bg-blue-200"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-4">
          <textarea
            className="border rounded-md w-full h-64 p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Encrypted content"
            name="content"
            value={enteredContent}
            onChange={handleOnContentChange}
            data-testid="password-content"
          />
        </div>

        <div className="flex space-x-4 mt-4">
          <button
            className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50 flex items-center
              ${isSaveDisabled ? 'bg-gray-400 cursor-not-allowed opacity-50' : 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500 text-white'}`}
            type="submit"
            disabled={isSaveDisabled}
            data-testid="save-password-entry-button"
          >
            {isSubmitting ? <FaSpinner className="text-white mr-2" /> : <FaSave className="text-white mr-2" />}
            <span>Save</span>
          </button>

          <NavLink
            to="/"
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
            type="button"
            onClick={() => {
              return redirect('/');
            }}
            data-testid="cancel-password-entry-button"
          >
            Cancel
          </NavLink>
        </div>
      </Form>
    </div>
  );
};

export default NewPass;
