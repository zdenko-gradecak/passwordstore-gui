// import logo from '../assets/logo.png';
import { version } from '../../../../package.json';

const Index = () => {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center">
      {/*<img src={logo} alt="Logo" className="w-64 h-64" />*/}
      <div className="text-4xl py-2">
        passwordstore
      </div>
      <div className="text-4xl py-2">
        GUI
      </div>
      <div className="pt-8">v{version}</div>
    </div>
  );
};

export default Index;
