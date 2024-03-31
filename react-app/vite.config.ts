import {defineConfig, loadEnv} from 'vite';
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default ({mode}) => {
  process.env = {...process.env, ...loadEnv(mode, process.cwd())};
  return defineConfig({
    base: "/",
    plugins: [react()],
    server: {
      port: 3000,
      strictPort: true,
      host: true,
      origin: `https://${process.env.VITE_REACT_APP_HOST}`,
    },
  });
}