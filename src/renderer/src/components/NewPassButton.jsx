import { FiPlus } from 'react-icons/fi';
import { NavLink } from 'react-router-dom';

const NewPassButton = () => {
  return (
    <NavLink
      to="pass/new"
      className={({ isActive }) => `fixed bottom-8 right-8 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
        ${isActive ? 'hidden' : ''}
      `}

    >
      <FiPlus className="h-6 w-6" />
    </NavLink>
  );
}

export default NewPassButton;
