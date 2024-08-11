import { Form, redirect, useLoaderData, useNavigate } from 'react-router-dom';
import { FaTrash } from 'react-icons/fa';

export const loader = async ({ params }) => {
  const passwordEntryPath = decodeURIComponent(params.passName);

  return { path: passwordEntryPath };
};

export const action = async ({ params }) => {
  const passwordEntryPath = decodeURIComponent(params.passName);

  await window.api.deletePasswordStoreEntry(passwordEntryPath);

  return redirect('/');
};

const DeletePass = () => {
  const navigate = useNavigate();
  const { path } = useLoaderData();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center border-b border-gray-200 mb-4 pb-2">
        <h3 className="text-xl font-medium text-gray-600 leading-none py-4">Delete {path}</h3>
      </div>

      <div className="mb-4 flex justify-center text-lg">
        Are you sure you want to delete?
      </div>
      <div className="mb-4 flex justify-center">
        <Form method="post" className="pt-6 flex items-center">
          <button
            type="submit"
            className="mr-6 px-4 py-2 bg-red-500 text-white rounded-md shadow hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 flex items-center"
            data-testid="delete-password-entry-button"
          >
            <FaTrash className="text-white mr-2" />
            <span>Delete</span> {/* Label */}
          </button>
          <button
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
            type="button"
            onClick={() => {
              navigate(`/pass/${encodeURIComponent(path)}`);
            }}
            data-testid="cancel-delete-password-entry-button"
          >
            Cancel
          </button>
        </Form>
      </div>
    </div>
  );
};

export default DeletePass;
