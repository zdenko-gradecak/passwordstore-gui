import { useState } from 'react';
import { FiChevronRight, FiChevronDown, FiLock } from 'react-icons/fi';
import { NavLink, useLocation } from 'react-router-dom';

const PasswordTree = ({ passwordStoreEntries, expandAllNodes }) => {
  const [expandedNodes, setExpandedNodes] = useState([]);
  const location = useLocation();

  const toggleNode = (path) => {
    setExpandedNodes((prev) =>
      prev.includes(path)
        ? prev.filter((node) => node !== path)
        : [...prev, path]
    );
  };

  const renderTree = (passwordStoreEntries) => {
    return (
      <ul>
        {passwordStoreEntries.map((password, index) => {
          const hasChildren = password.children.length > 0;
          const isExpanded = expandedNodes.includes(password.path) || expandAllNodes === true;

          return (
            <li key={index} className="mb-1">
              {hasChildren ? (
                <button
                  className="flex items-center w-full p-2 rounded-md text-left hover:bg-blue-200 focus:outline-none"
                  onClick={() => toggleNode(password.path)}
                  data-testid="password-list-item"
                >
                  <span className="mr-2">
                    {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
                  </span>
                  <span>{password.name}</span>
                </button>
              ) : (
                <NavLink
                  to={`pass/${encodeURIComponent(password.path)}${location.search}`}
                  className={({ isActive }) =>
                    `flex items-center w-full p-2 rounded-md text-left ${isActive ? 'bg-blue-500 text-white' : 'hover:bg-blue-200'}`
                  }
                  data-testid="password-list-item"
                >
                  <span className="mr-2 w-4">
                    <FiLock />
                  </span>
                  <span>{password.name}</span>
                </NavLink>
              )}
              {isExpanded && hasChildren > 0 && renderTree(password.children)}
            </li>
          );
        })}
      </ul>
    );
  };

  return <div>{renderTree(passwordStoreEntries)}</div>;
};

export default PasswordTree;
