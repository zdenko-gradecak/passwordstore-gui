import { useState } from 'react';
import { FiChevronRight, FiChevronDown } from 'react-icons/fi';
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
            <li key={index}>
              <div className="flex items-center">
                {hasChildren ? (
                  <span>
                    {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
                  </span>
                ) : (
                  <span className="inline-block w-4"></span>
                )}
                {hasChildren ? (
                  <button
                    className="w-full block m-1 p-2 rounded-md text-left hover:bg-blue-200"
                    onClick={() => toggleNode(password.path)}
                    data-testid="password-list-item"
                  >
                    {password.name}
                  </button>
                ) : (
                  <NavLink
                    to={`pass/${encodeURIComponent(password.path)}${location.search}`}
                    className={({ isActive }) => `w-full block m-1 p-2 rounded-md text-left ${isActive ? 'bg-blue-500 text-white' : 'hover:bg-blue-200'}`}
                    data-testid="password-list-item"
                  >
                    {password.name}
                  </NavLink>
                )}

              </div>
              {isExpanded && hasChildren > 0 &&
                renderTree(password.children)}
            </li>
          );
        })}
      </ul>
    );
  };

  return <div>{renderTree(passwordStoreEntries)}</div>;
};

export default PasswordTree;
