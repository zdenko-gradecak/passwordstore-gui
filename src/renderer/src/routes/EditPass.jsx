import { Form, redirect, useLoaderData, useNavigate, useNavigation } from 'react-router-dom';
import { FaSave, FaSpinner } from 'react-icons/fa';
import { useEffect, useRef } from 'react';

export const loader = async ({ params }) => {
  const passwordEntryPath = decodeURIComponent(params.passName);
  const passwordEntryContent = await window.api.getPasswordStoreEntry(passwordEntryPath);

  return { path: passwordEntryPath, content: passwordEntryContent };
};

export const action = async ({ request, params }) => {
  const formData = await request.formData();
  const updates = Object.fromEntries(formData);
  const passwordEntryPath = decodeURIComponent(params.passName);

  await window.api.savePasswordStoreEntry(passwordEntryPath, updates.content);

  return redirect(`/pass/${encodeURIComponent(params.passName)}`);
};

const EditPass = () => {
  const navigation = useNavigation();
  const navigate = useNavigate();
  const { path, content } = useLoaderData();
  const contentInputRef = useRef(null);

  const isSubmitting = navigation.state === 'submitting';
  const isLoading = navigation.state === 'loading';

  useEffect(() => {
    setTimeout(() => {
      if (contentInputRef.current) {
        contentInputRef.current.focus();
        contentInputRef.current.selectionStart = contentInputRef.current.value.length;
      }
    }, 0);
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Form method="post">
        <div className="flex justify-between items-center border-b border-gray-200 mb-4 pb-2">
          <h3 className="text-xl font-medium text-gray-600 leading-none py-4">{path}</h3>
        </div>

        <div className="mb-4">
          <textarea
            className="border rounded-md w-full h-64 p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            name="content"
            defaultValue={content}
            ref={contentInputRef}
            data-testid="password-content"
          />
        </div>

        <div className="flex space-x-4 mt-4">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center"
            type="submit"
            disabled={isLoading || isSubmitting}
            data-testid="save-password-entry-button"
          >
            {isSubmitting
              ? <FaSpinner className="text-white mr-2" />
              : <FaSave className="text-white mr-2" />
            }
            <span>Save</span>
          </button>

          <button
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
            type="button"
            onClick={() => {
              navigate(-1);
            }}
            data-testid="cancel-password-entry-button"
          >
            Cancel
          </button>
        </div>
      </Form>
    </div>
  );
};

export default EditPass;
