import { NavLink, useRouteError } from 'react-router-dom';
import { FiAlertTriangle, FiSettings } from 'react-icons/fi';

const ErrorPage = () => {
  const error = useRouteError();
  console.error(error);

  return (
    <div className="flex h-screen">
      <div
        className="w-full bg-gray-200 p-4 overflow-y-auto">
        <div className="max-w-4xl bg-white mx-auto p-6">
          <div className="flex items-center border-b border-gray-200 mb-4 pb-2">
            <span><FiAlertTriangle/></span><h3 className="text-xl font-medium text-gray-600 leading-none ml-2 py-4">Error</h3>
          </div>

          <div className="mb-4">
            Sorry, an unexpected error has occurred:
          </div>
          <div className="mb-4">
            <div className="bg-gray-900 text-white p-10 rounded-lg shadow-lg overflow-x-auto">
              <pre className="text-sm font-mono">
                <code>
                  {error.statusText || error.message}
                </code>
              </pre>
            </div>
          </div>

          <div className="flex space-x-4 mt-8">
            <NavLink
              to="settings"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center"
            >
              <FiSettings/>
              <span class="px-2">Settings</span>
            </NavLink>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
