import { NavLink, Outlet, useLoaderData, useNavigation } from 'react-router-dom';
import PassTree from '../components/PassTree';
import NewPassButton from '../components/NewPassButton';
import SearchBar from '../components/SearchBar';
import { FiSettings } from 'react-icons/fi';

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const q = url.searchParams.get('q');

  const passwordStoreEntries = await window.api.getPasswordStoreEntries(q);

  return { passwordStoreEntries, q };
};

const Root = () => {
  const navigation = useNavigation();
  const { passwordStoreEntries, q } = useLoaderData();
  const isLoading = navigation.state === 'loading';

  return (
    <div className="flex h-screen">
      <div className="w-1/3 bg-gray-200 relative flex flex-col">
        <div className="fixed top-0 left-0 w-1/3 p-4 pb-0 bg-gray-200 z-10 border-b-2 border-gray-300">
          <SearchBar query={q}/>
        </div>
        <div className="flex-1 mt-20 mb-10 overflow-y-auto p-4 pt-0">
          <PassTree passwordStoreEntries={passwordStoreEntries} expandAllNodes={q?.length > 0}/>
        </div>
        <div className="flex flex-row-reverse fixed bottom-0 left-0 w-1/3 p-2 bg-gray-200 z-10">
          <NavLink
            to="settings"
            className="p-4 m-0 rounded-md text-left hover:bg-blue-200"
          >
            <span className="">
              <FiSettings/>
            </span>
          </NavLink>
        </div>
      </div>

      <div
        className={`w-2/3 bg-white p-4 overflow-y-auto ${isLoading ? 'opacity-25 transition-opacity duration-200' : ''}`}>
        <Outlet/>
      </div>

      <NewPassButton />
    </div>
  );
};

export default Root;
