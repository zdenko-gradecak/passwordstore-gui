import { Form, redirect, useLoaderData, useNavigate, useNavigation } from 'react-router-dom';
import { FaSave, FaSpinner } from 'react-icons/fa';

export const loader = async () => {
  const settingsData = await window.api.getSettingsData();

  return { settingsData: settingsData };
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const updates = Object.fromEntries(formData);

  await window.api.saveSettingsData(updates);

  return redirect('/');
};

const Settings = () => {
  const navigation = useNavigation();
  const navigate = useNavigate();
  const { settingsData } = useLoaderData();

  const isSubmitting = navigation.state === 'submitting';
  const isLoading = navigation.state === 'loading';

  return (
    <div className="flex h-screen">
      <div
        className={`w-full bg-gray-200 p-4 overflow-y-auto ${isLoading ? 'opacity-25 transition-opacity duration-200' : ''}`}>

        <div className="max-w-4xl bg-white mx-auto p-6">
          <Form method="post">
            <div className="flex justify-between items-center border-b border-gray-200 mb-4 pb-2">
              <h3 className="text-xl font-medium text-gray-600 leading-none py-4">Settings</h3>
            </div>

            <div className="mb-4">
              Password store path:
              <input
                className="border rounded-md w-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                name="path"
                defaultValue={settingsData.path}
                data-testid="settings-data-path"
            />
            </div>

            <div className="flex space-x-4 mt-4">
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center"
                type="submit"
                disabled={isLoading || isSubmitting}
                data-testid="save-settings-button"
              >
                {isSubmitting
                  ? <FaSpinner className="text-white mr-2"/>
                  : <FaSave className="text-white mr-2"/>
                }
                <span>Save</span>
              </button>

              <button
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                type="button"
                onClick={() => {
                  navigate('/');
                }}
                data-testid="cancel-settings-button"
              >
                Cancel
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
