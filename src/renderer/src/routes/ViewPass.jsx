import { Form, NavLink, useLoaderData, useNavigation } from 'react-router-dom';
import { FaEdit, FaSpinner, FaTrash } from 'react-icons/fa';

export const loader = async ({ params }) => {
  const passwordEntryPath = decodeURIComponent(params.passName);
  const passwordEntryContent = await window.api.getPasswordStoreEntry(passwordEntryPath);

  return { path: passwordEntryPath, content: passwordEntryContent };
};

const ViewPass = () => {
  const { path, content } = useLoaderData();
  const navigation = useNavigation();

  const isSubmitting = navigation.state === 'submitting';

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center border-b border-gray-200 mb-4 pb-2">
        <h3 className="text-xl font-medium text-gray-600 leading-none py-4">{path}</h3>
        <Form action="edit">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md shadow hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center"
            data-testid="edit-password-entry-button"
          >
            <FaEdit className="text-white mr-2" />
            <span>Edit</span> {/* Label */}
          </button>
        </Form>
      </div>

      <div className="mb-4">
        <textarea
          className="border rounded-md w-full h-64 p-4 bg-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={content}
          readOnly={true}
          data-testid="password-content"
        />
      </div>

      <div className="flex space-x-4 mt-4">
        <div className="flex-1"></div>
        <NavLink
          to={`/pass/${encodeURIComponent(path)}/delete`}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 flex items-center"
          disabled={isSubmitting}
          data-testid="delete-password-entry-button"
        >
          {isSubmitting
            ? <FaSpinner className="text-white mr-2" />
            : <FaTrash className="text-white mr-2" />
          }
          <span>Delete</span>
        </NavLink>
      </div>
    </div>
  );
};

export default ViewPass;
