import Chatbot from './components/Chatbot';
import { PrimeReactProvider } from 'primereact/api';
import { useTranslation } from 'react-i18next';
function App() {
  const [t, i18n] = useTranslation("global");

  window.LoginUser = "MAX_SAM";

  return (
    <PrimeReactProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Chatbot t={t} />
        </div>
      </div>
    </PrimeReactProvider>
  );
}

export default App;
